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

import { hasKey } from "./nodes/Key.js"

import {
  Graph,
  emptySequence,
  isChoice,
  isSequence,
  isParallel,
  isSubTask,
  isTitledSteps,
  sequence,
  subtask,
} from "./index.js"

import { hasTitle } from "./nodes/EnTitled.js"

function collapse(graph: Graph, choices: ChoiceState): Graph {
  if (isChoice(graph)) {
    const madeChoiceTitle = choices.get(graph)
    if (madeChoiceTitle) {
      const isMulti = graph.choices.every((_) => _.multiselect) && /^\[.+\]$/.test(madeChoiceTitle)
      const pattern = new RegExp(
        // madeChoiceTitle may be JSON in the case of a form, so
        // escape the {} parts; see test/input/26
        "^" + madeChoiceTitle.replace(/[{}[]]/g, "\\$&") + "$", // $& means the whole matched string,
        "i"
      )
      const matchingSubtrees = graph.choices.filter((_) => pattern.test(_.title))

      if (isMulti) {
        try {
          const previouslySelected = JSON.parse(madeChoiceTitle) as string[]
          const multiset = isMulti ? new Set(previouslySelected) : undefined
          if (previouslySelected.every((selection) => graph.choices.find((_) => selection === _.title))) {
            // then every selected option in the multiset still exists
            return sequence(graph.choices.filter((_) => multiset.has(_.title)).map((_) => _.graph))
          }
        } catch (err) {
          console.error("Error processing prior multiset choice", err)
        }
      } else if (matchingSubtrees.length > 0) {
        // this means that the user's prior answer, or an asserted
        // answer has at least one match based on the current shape of
        // the choice graph
        const collapsedGraph = matchingSubtrees.map((chosenSubtree) => {
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
        })

        return collapsedGraph.length === 0
          ? undefined
          : collapsedGraph.length === 1
          ? collapsedGraph[0]
          : Object.assign({}, graph, { choices: collapsedGraph })
      } else {
        // then either we have no prior/asserted answer for this
        // choice, or that prior answer is no longer valid
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
