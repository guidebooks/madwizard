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

import {
  Choice,
  Graph,
  TitledGraph,
  LeafNode,
  hasTitle,
  isBarrier,
  isChoice,
  isParallel,
  isSequence,
  isSubTask,
  isTitledSteps,
  withTitle,
} from "."

/** Choose `A` if it has a title, else `B` */
function titlest(A: Graph, B?: TitledGraph) {
  return hasTitle(A) ? A : B
}

/**
 * If we have a nearest entitled parent `B`, then wrap that title
 * around `A`, and push it on `S`. This will help with later
 * presentation, so we have some explanation for what the `LeafNode`
 * code block is doing.
 */
function pushWithTitle(S: Graph[], A: LeafNode, B?: TitledGraph, isPartOfBarrier = false) {
  if (B) {
    S.push(withTitle(A, B, isPartOfBarrier))
  } else {
    S.push(A)
  }
}

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
  nearestEnclosingTitledSubgraph?: TitledGraph,
  isPartOfBarrier = false
): { prereqs?: Graph[]; choice: Choice }[] {
  const recurse = (graph: Graph) =>
    _findChoiceFrontier(
      graph,
      prereqs,
      titlest(graph, nearestEnclosingTitledSubgraph),
      isPartOfBarrier || isBarrier(graph)
    )

  if (isChoice(graph)) {
    // user has not yet made a choice. stop here and consume all
    // prereqs
    const frontier = [{ prereqs: prereqs.slice(), choice: graph }]
    prereqs.splice(0, prereqs.length) // consume...
    return frontier
  } else if (isSubTask(graph)) {
    return recurse(graph.graph)
  } else if (isSequence(graph)) {
    return graph.sequence.flatMap(recurse)
  } else if (isParallel(graph)) {
    return graph.parallel.flatMap(recurse)
  } else if (isTitledSteps(graph)) {
    return graph.steps.flatMap((_) => recurse(_.graph))
  } else {
    // leaf-most code blocks. no choices here.
    pushWithTitle(prereqs, graph, nearestEnclosingTitledSubgraph, isPartOfBarrier)
    return []
  }
}

export function findChoiceFrontier(graph: Graph) {
  const prereqs = []
  const frontier = _findChoiceFrontier(graph, prereqs)
  if (prereqs.length > 0) {
    frontier.push({ prereqs, choice: undefined })
  }
  return frontier
}

export function findChoicesOnFrontier(graph: Graph): Choice[] {
  if (isChoice(graph)) {
    return [graph]
  } else if (isSubTask(graph)) {
    return findChoicesOnFrontier(graph.graph)
  } else if (isSequence(graph)) {
    return graph.sequence.flatMap(findChoicesOnFrontier)
  } else if (isParallel(graph)) {
    return graph.parallel.flatMap(findChoicesOnFrontier)
  } else if (isTitledSteps(graph)) {
    return graph.steps.flatMap((_) => findChoicesOnFrontier(_.graph))
  } else {
    return []
  }
}
