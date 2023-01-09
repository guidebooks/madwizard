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

import { v4 } from "uuid"

import Key from "./Key.js"
import Graph, { sameGraph } from "../Graph.js"
import { Ordered, Unordered } from "./Ordered.js"
import { CodeBlockProps } from "../../codeblock/CodeBlockProps.js"

export type Sequence<T extends Unordered | Ordered = Unordered> = T &
  Key & {
    sequence: Graph<T>[]
  }

export type OrderedSequence = Sequence<Ordered>

export function isSequence<T extends Unordered | Ordered = Unordered>(graph: Graph<T>): graph is Sequence<T> {
  return graph && Array.isArray((graph as Sequence).sequence)
}

export function sequence(graphs: Graph[]): Sequence {
  return {
    // here, we flatten nested sequences
    key: v4(),
    sequence: graphs.flatMap((_) => (isSequence(_) ? _.sequence : _)),
  }
}

export function emptySequence(): Sequence {
  return sequence([])
}

export function seq(block: CodeBlockProps): Sequence {
  return sequence([block])
}

export function sameSequence(A: Sequence = emptySequence(), B: Sequence = emptySequence()) {
  return (
    A.sequence.length === B.sequence.length &&
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    A.sequence.every((a, idx) => sameGraph(a, B.sequence[idx]))
  )
}

export default Sequence
