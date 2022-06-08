/*
 * Copyright 2022 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ChoiceState, updateContent } from "../choices/index.js"
import {
  Graph,
  emptySequence,
  hasKey,
  hasTitle,
  isChoice,
  isSequence,
  isParallel,
  isSubTask,
  isTitledSteps,
  sequence,
  subtask,
} from "./index.js"

function collapse(graph: Graph, choices: ChoiceState): Graph {
  if (isChoice(graph)) {
    const madeChoiceTitle = choices.get(graph)
    if (madeChoiceTitle) {
      const chosenSubtree = graph.choices.find(
        (_) => _.title.localeCompare(madeChoiceTitle, undefined, { sensitivity: "accent" }) === 0
      )
      if (chosenSubtree) {
        // yes! we can collapse to the chosen subgraph
        const chosenSubgraph =
          isSequence(chosenSubtree.graph) && chosenSubtree.graph.sequence.length === 1
            ? chosenSubtree.graph.sequence[0]
            : chosenSubtree.graph

        const collapsed = collapse(chosenSubgraph, choices)
        if (!hasTitle(collapsed) && hasTitle(graph)) {
          // TODO with graph.source
          return subtask(
            hasKey(collapsed) ? collapsed.key : graph.group,
            graph.title,
            graph.title,
            "",
            "",
            sequence([collapsed]),
            graph.source
          )
        } else {
          return collapsed
        }
      } else {
        const form = choices.form(graph)
        if (form) {
          // do we have values for every part?
          if (graph.choices.every((_) => !!form[_.title])) {
            // then unwrap the choice
            return sequence(graph.choices.flatMap((_) => updateContent(_, form[_.title]).graph))
          }
        }
      }
    }

    // otherwise, scan the subgraphs across the choices
    const subchoices = graph.choices
      .filter(Boolean)
      .map((_) => {
        const subgraph = collapse(_.graph, choices)
        if (subgraph) {
          return Object.assign({}, _, { graph: subgraph })
        }
      })
      .filter(Boolean)
    if (subchoices.length > 0) {
      return Object.assign({}, graph, { choices: subchoices })
    }
  } else if (isSequence(graph)) {
    const subgraphs = graph.sequence.map((_) => collapse(_, choices)).filter(Boolean)

    if (subgraphs.length > 0) {
      const sequence = subgraphs.every(isSequence) ? subgraphs.flatMap((_) => _.sequence) : subgraphs
      return Object.assign({}, graph, { sequence })
    }
  } else if (isParallel(graph)) {
    const parallel = graph.parallel.map((_) => collapse(_, choices)).filter(Boolean)

    if (parallel.length > 0) {
      return Object.assign({}, graph, { parallel })
    }
  } else if (isSubTask(graph)) {
    const subgraph = collapse(graph.graph, choices)
    if (subgraph) {
      return Object.assign({}, graph, { graph: subgraph })
    }
  } else if (isTitledSteps(graph)) {
    const steps = graph.steps
      .map((_) => {
        const subgraph = collapse(_.graph, choices)
        if (subgraph) {
          return Object.assign({}, _, { graph: subgraph })
        }
      })
      .filter(Boolean)

    if (steps.length > 0) {
      return Object.assign({}, graph, { steps })
    }
  } else {
    return graph
  }
}

export default function collapseMadeChoices(graph: Graph, choices: ChoiceState): Graph {
  return collapse(graph, choices) || emptySequence()
}
