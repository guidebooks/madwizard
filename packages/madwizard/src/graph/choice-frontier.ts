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

import { ChoiceState } from "../choices/index.js"

import Graph, { isBarrier } from "./Graph.js"

import LeafNode from "./nodes/LeafNode.js"
import { isParallel } from "./nodes/Parallel.js"
import { isSequence } from "./nodes/Sequence.js"
import Choice, { isChoice } from "./nodes/Choice.js"
import { isTitledSteps } from "./nodes/TitledSteps.js"
import EnTitled, { hasTitle, withTitle } from "./nodes/EnTitled.js"
import { FinallySubTask, isSubTask, isNormalSubTask } from "./nodes/SubTask.js"

/** Choose `A` if it has a title, else `B` */
function titlest(A: Graph, B?: EnTitled) {
  return hasTitle(A) ? A : B
}

/**
 * If we have a nearest entitled parent `B`, then wrap that title
 * around `A`, and push it on `S`. This will help with later
 * presentation, so we have some explanation for what the `LeafNode`
 * code block is doing.
 */
function pushWithTitle(S: Graph[], A: LeafNode, B?: EnTitled, isPartOfBarrier = false) {
  if (B) {
    S.push(withTitle(A, B, isPartOfBarrier))
  } else {
    S.push(A)
  }
}

type Frontier = { prereqs?: Graph[]; choice: Choice; finallies?: FinallySubTask[] }

/**
 * Find the first set of `Choice` nodes, when scanning the given
 * `graph`. Do not scan under Choice nodes for nested choices... we
 * assume that `collapseMadeChoices` has already been applied to the
 * `graph`.
 *
 */
export function _findChoiceFrontier(
  graph: Graph,
  prereqs: Graph[],
  finallies: FinallySubTask[],
  nearestEnclosingTitle?: EnTitled,
  isPartOfBarrier = false
): Frontier[] {
  const recurse = (graph: Graph, title?: EnTitled) =>
    _findChoiceFrontier(
      graph,
      prereqs,
      finallies,
      title || titlest(graph, nearestEnclosingTitle),
      isPartOfBarrier || isBarrier(graph)
    )

  const recurse2 = (graph: Graph) => recurse(graph)

  if (isChoice(graph)) {
    // User has not yet made a decision on this choice. Stop here and
    // consume all prereqs. The combination of slice() and splice()
    // makes sure we attach all accumulated prereqs with this choice
    // (the slice), and then clear them out of the accumulated model
    // (the splice).
    const frontier: Frontier = { choice: graph }
    if (prereqs.length > 0) {
      frontier.prereqs = prereqs.slice()
      prereqs.splice(0, prereqs.length)
    }
    if (finallies.length > 0) {
      frontier.finallies = finallies.slice()
      finallies.splice(0, finallies.length)
    }
    return [frontier]
  } else if (isSubTask(graph)) {
    if (isNormalSubTask(graph)) {
      return recurse(graph.graph)
    } else {
      finallies.push(graph)
      return []
    }
  } else if (isSequence(graph)) {
    return graph.sequence.flatMap(recurse2)
  } else if (isParallel(graph)) {
    return graph.parallel.flatMap(recurse2)
  } else if (isTitledSteps(graph)) {
    return graph.steps.flatMap((_) => recurse(_.graph, _))
  } else {
    // leaf-most code blocks. no choices here.
    pushWithTitle(prereqs, graph, nearestEnclosingTitle, isPartOfBarrier)
    return []
  }
}

export function findChoiceFrontier(graph: Graph): Frontier[] {
  const prereqs = []
  const finallies = []
  const frontier = _findChoiceFrontier(graph, prereqs, finallies)

  // We may have post-choice code blocks, i.e. choices that are not
  // dependent on any choice. If so, tack these on the end of the
  // model as "prereqs" with no associated choice.
  if (prereqs.length > 0 || finallies.length > 0) {
    const last: Frontier = { choice: undefined }
    if (prereqs.length > 0) {
      last.prereqs = prereqs
    }
    if (finallies.length > 0) {
      last.finallies = finallies
    }
    frontier.push(last)
  }

  return frontier
}

export function findChoicesOnFrontier(graph: Graph, choices?: ChoiceState): Choice[] {
  if (isChoice(graph)) {
    if (!choices || !choices.get(graph)) {
      return [graph]
    } else {
      const madeChoiceTitle = choices.get(graph)
      const chosenSubtree = graph.choices.find(
        (_) => _.title.localeCompare(madeChoiceTitle, undefined, { sensitivity: "accent" }) === 0
      )
      if (!chosenSubtree) {
        return [graph]
      } else {
        return findChoicesOnFrontier(chosenSubtree.graph, choices)
      }
    }
  } else if (isNormalSubTask(graph)) {
    return findChoicesOnFrontier(graph.graph, choices)
  } else if (isSequence(graph)) {
    return graph.sequence.flatMap((_) => findChoicesOnFrontier(_, choices))
  } else if (isParallel(graph)) {
    return graph.parallel.flatMap((_) => findChoicesOnFrontier(_, choices))
  } else if (isTitledSteps(graph)) {
    return graph.steps.flatMap((_) => findChoicesOnFrontier(_.graph, choices))
  } else {
    return []
  }
}
