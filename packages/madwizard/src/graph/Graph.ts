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

import LeafNode from "./nodes/LeafNode.js"
import InteriorNode from "./nodes/InteriorNode.js"

import { isChoice } from "./nodes/Choice.js"
import { isSubTask } from "./nodes/SubTask.js"
import { isSequence } from "./nodes/Sequence.js"
import { isParallel } from "./nodes/Parallel.js"
import { isTitledSteps } from "./nodes/TitledSteps.js"
import { Ordered, Unordered } from "./nodes/Ordered.js"

import { Barrier, Validatable, Source } from "../codeblock/CodeBlockProps.js"

export { default as sameGraph } from "./same.js"

/** The task graph model */
type Graph<T extends Unordered | Ordered = Unordered> = InteriorNode<T> | LeafNode<T>

/** The task graph model, with a DFS pre- and post-order number assigned to each graph node. */
export type OrderedGraph = Graph<Ordered>

export function isEmpty(A: Graph): boolean {
  return (
    (isSequence(A) && A.sequence.length === 0) ||
    (isParallel(A) && A.parallel.length === 0) ||
    (isTitledSteps(A) && A.steps.length === 0) ||
    (isChoice(A) && A.choices.length === 0)
  )
}

export function hasSource(graph: Graph): graph is Graph & Source {
  return typeof (graph as any).source !== "undefined"
}

export function isBarrier(graph: Graph): graph is Graph & Barrier & { barrier: true } {
  return isSubTask(graph) && graph.barrier
}

export function isValidatable<T extends Ordered | Unordered, G extends Graph<T>>(graph: G): graph is G & Validatable {
  const validate = (graph as Validatable).validate
  return typeof validate === "string" || typeof validate === "number" || typeof validate === "boolean"
}

export default Graph
