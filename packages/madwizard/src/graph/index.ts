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
 * blocks. @see ../README.md for more detail.
 *
 * Given a set of code blocks. call `compile` to get a `Graph`. Given
 * a Graph, you may ask for its `progress` towards completion, or, via
 * `blocks`, ask for a linear dump back to the original set of code
 * blocks.
 *
 */

export { Ordered, Unordered } from "./nodes/Ordered.js"
export { extractTitle, extractDescription } from "./nodes/EnTitled.js"
export { default as SubTask, OrderedSubTask, isSubTask } from "./nodes/SubTask.js"
export { default as Parallel, OrderedParallel, isParallel } from "./nodes/Parallel.js"
export { default as TitledSteps, OrderedTitledSteps, isTitledSteps } from "./nodes/TitledSteps.js"
export { default as Sequence, OrderedSequence, isSequence, sequence } from "./nodes/Sequence.js"
export { default as LeafNode, OrderedLeafNode, isLeafNode, bodySource } from "./nodes/LeafNode.js"
export { default as Choice, OrderedChoice, ChoicePart, isChoice, isPartOfForm, choose } from "./nodes/Choice.js"
export { default as Graph, OrderedGraph, hasSource, isBarrier, isEmpty, isValidatable, sameGraph } from "./Graph.js"

export * from "./order.js"
export * from "./vetoes.js"
export * from "./Status.js"
export * from "./compile.js"
export * from "./optional.js"
export * from "./progress.js"
export * from "./validate.js"
export * from "./linearize.js"
export * from "./choice-frontier.js"

// export type OrderedCodeBlock = CodeBlockProps & Ordered
