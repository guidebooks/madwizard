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

// TODO allow a ValidationExecutor to be passed in
import {
  Graph,
  Choice,
  ChoicePart,
  blocks,
  isSequence,
  isParallel,
  isChoice,
  isTitledSteps,
  isSubTask,
  shellExec,
} from "../../graph"

function updateTemplate(part: ChoicePart, choice: string, member = 0) {
  part.title = choice
  part.member = member

  const pattern = /\$\{?choice\}?/gi
  blocks(part.graph).forEach((_) => {
    _.body = _.body.replace(pattern, choice)

    if (_.validate) {
      _.validate = _.validate.replace(pattern, choice)
    }
  })

  if (part.description) {
    part.description = part.description.replace(pattern, choice)
  }
}

function rewriteChoiceToIncludeExpansion(graph: Choice, names: string[]) {
  const firstChoice = graph.choices[0]
  graph.choices = []

  names.forEach((name, idx) => {
    // clone the first choice, and smash in the template paramter
    const choice = JSON.parse(JSON.stringify(firstChoice))
    updateTemplate(choice, name, idx)

    // and then add it to the list of choices
    graph.choices.push(choice)
  })
}

function isExpansionGroup(graph: Choice) {
  const match = graph.group.match(/expand\((.+)\)/)
  return match && match[1]
}

export async function expand(graph: Graph) {
  if (isSequence(graph)) {
    await Promise.all(graph.sequence.map(expand))
  } else if (isParallel(graph)) {
    await Promise.all(graph.parallel.map(expand))
  } else if (isChoice(graph)) {
    const expansionExpr = isExpansionGroup(graph)
    if (expansionExpr) {
      // debug("expansion/expr", expansionExpr)

      const opts = { capture: "", throwErrors: true }
      try {
        await shellExec(expansionExpr, opts)
        // debug("expansion/response", opts.capture)
        const response = opts.capture.split(/\n/).filter(Boolean)
        rewriteChoiceToIncludeExpansion(graph, response)
      } catch (err) {
        // debug("expansion/error", err)
      }
    }

    await Promise.all(graph.choices.map((_) => expand(_.graph)))
  } else if (isSubTask(graph)) {
    await expand(graph.graph)
  } else if (isTitledSteps(graph)) {
    await Promise.all(graph.steps.map((_) => expand(_.graph)))
  }

  return graph
}
