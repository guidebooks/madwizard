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

import { isExpansionGroup } from "../choices/groups/expansion.js"
import { Choice, Graph, isSubTask, isChoice, isLeafNode, isSequence, isParallel, isTitledSteps } from "./index.js"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assertUnreachable(x: never): never {
  throw new Error("Didn't expect to get here")
}

/**
 * This enables a full discrimination between two choices. Are they
 * the same choice, imported twice, or are these two different choices
 * inside a single file?
 *
 * Note: we must be careful not to consider an `expand(...)` (i.e. a
 * choice whose options are dynamically expanded) as different from the
 * same choice, after expansion).
 */
function fullKey(graph: Choice) {
  return [
    graph.groupContext,
    ...(graph.provenance || []),
    ...(isExpansionGroup(graph) ? [] : graph.choices.map((_) => _.title)),
  ].join(",")
}

/**
 * Ideally, each choice should be in its own file, so that the
 * recording of what the user chose can be clearly identified (by the
 * path of that file within the store).

 * Sometimes that is not possible. This logic detects this situation
 * and applies a non-ideal correction.
 *
 * Note: we want to avoid incorrectly renaming a guidebook that is
 * imported more than once. The optimizer may remove some duplicates
 * (hence any renaming wouldn't matter), but it cannot always; e.g. if
 * a duplicated guidebook is conditionally imported a second time,
 * that choice will not be optimized away.
 *
 * Hence the `hash` versus `fullKey`. The hash is cheaper but may
 * suffer from the Noted problem. The fullKey allows for a more
 * careful discrimination between two choices.
 */
export default function workaroundMultipleChoicesPerFile(
  graph: Graph,
  contextsSeenSoFar: Record<string, { graph: Choice; count: number }> = {}
) {
  if (isSequence(graph)) {
    graph.sequence.forEach((_) => workaroundMultipleChoicesPerFile(_, contextsSeenSoFar))
  } else if (isParallel(graph)) {
    graph.parallel.forEach((_) => workaroundMultipleChoicesPerFile(_, contextsSeenSoFar))
  } else if (isSubTask(graph)) {
    if (graph.graph) {
      workaroundMultipleChoicesPerFile(graph.graph, contextsSeenSoFar)
    }
  } else if (isTitledSteps(graph)) {
    graph.steps.forEach((_) => {
      if (_.graph) {
        workaroundMultipleChoicesPerFile(_.graph, contextsSeenSoFar)
      }
    })
  } else if (isChoice(graph)) {
    const hash = graph.groupContext

    const soFar = contextsSeenSoFar[hash]
    if (!soFar) {
      contextsSeenSoFar[hash] = { graph, count: 1 }
    } else if (!/^madwizard/.test(graph.groupContext)) {
      // ignore internal/fabricated choices
      // this means that a single file has more than one choice. since
      // we use the file name (really it's path within the store) to
      // identify the choice, we need to hack on a discriminant to
      // avoid the separate choices from colliding in the ChoiceState
      // model; that is the mnodel from a presented choice to ... what
      // the user actually choice from the list of options)

      const equalityA = fullKey(soFar.graph)
      const equalityB = fullKey(graph)
      if (equalityA !== equalityB) {
        graph.groupContext += `_${soFar.count++}`
      }
    }

    graph.choices.forEach((_) => workaroundMultipleChoicesPerFile(_.graph, contextsSeenSoFar))
  } else if (isLeafNode(graph)) {
    // nothing to do here
  } else {
    assertUnreachable(graph)
  }

  return graph
}
