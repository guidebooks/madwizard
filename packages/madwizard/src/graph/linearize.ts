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

/**
 * This file defines a dependence structure over a set of code
 * blocks. @see ./README.md for more detail.
 *
 * Given a set of code blocks. call `compile` to get a `Graph`. Given
 * a Graph, you may ask for its `progress` towards completion, or, via
 * `blocks`, ask for a linear dump back to the original set of code
 * blocks.
 *
 */

import {
  Ordered,
  Unordered,
  Graph,
  choose,
  isLeafNode,
  isSequence,
  isParallel,
  isSubTask,
  isTitledSteps,
  isChoice,
} from "./index.js"

import { ChoiceState } from "../choices/index.js"
import { CodeBlockProps } from "../codeblock/index.js"

export function nodes<T extends Unordered | Ordered, F extends Graph<T>>(
  graph: Graph<T>,
  include: (node: Graph<T>) => node is F
): F[] {
  if (!graph) {
    return []
  }

  const subnodes = (subgraph: Graph<T>) => nodes<T, F>(subgraph, include)
  const list = include(graph) ? [graph] : []

  if (isSequence(graph)) {
    return list.concat(graph.sequence.flatMap(subnodes))
  } else if (isParallel(graph)) {
    return list.concat(graph.parallel.flatMap(subnodes))
  } else if (isSubTask(graph)) {
    return list.concat(subnodes(graph.graph))
  } else if (isTitledSteps(graph)) {
    return list.concat(graph.steps.map((_) => _.graph).flatMap(subnodes))
  } else if (isChoice(graph)) {
    return list.concat(graph.choices.map((_) => _.graph).flatMap(subnodes))
  } else {
    return []
  }
}

/** @return A linearized set of code blocks in the given `graph` */
export function blocks<T extends Unordered | Ordered>(
  graph: Graph<T>,
  choices: "all" | "default-path" | ChoiceState = "default-path",
  includeOptional = false,
  expandNestedChoices = true
): (CodeBlockProps & T)[] {
  const subblocks = (subgraph: Graph<T>) => blocks(subgraph, choices, includeOptional, expandNestedChoices)

  if (!graph) {
    return []
  } else if (isSequence<T>(graph)) {
    return graph.sequence.flatMap(subblocks)
  } else if (isParallel<T>(graph)) {
    return graph.parallel.flatMap(subblocks)
  } else if (isSubTask<T>(graph)) {
    return subblocks(graph.graph)
  } else if (isTitledSteps<T>(graph)) {
    return graph.steps.map((_) => _.graph).flatMap(subblocks)
  } else if (isChoice<T>(graph)) {
    if (!expandNestedChoices) {
      return []
    } else if (choices === "all") {
      // return the union across all choices
      return graph.choices.map((_) => _.graph).flatMap(subblocks)
    } else {
      // return the current/default selection
      return subblocks(choose(graph, choices))
    }
  } else if (isLeafNode(graph) && (!graph.optional || includeOptional)) {
    return [graph]
  } else {
    return []
  }
}

export function blocksUpToChoiceFrontier<T extends Unordered | Ordered>(graph: Graph<T>): (CodeBlockProps & T)[] {
  return blocks(graph, undefined, undefined, false)
}

/**
 * @return the top-level subgraphs of the given Graph. Do not
 * recursively expand.
 */
export function partsOf<T extends Unordered | Ordered>(graph: Graph<T>) {
  return isSequence(graph)
    ? graph.sequence
    : isParallel(graph)
    ? graph.parallel
    : isChoice(graph)
    ? graph.choices.map((_) => _.graph)
    : isTitledSteps(graph)
    ? graph.steps.map((_) => _.graph)
    : isSubTask(graph)
    ? [graph.graph]
    : [graph]
}
