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

import Graph, { sameGraph } from "../Graph.js"

import { Sequence } from "./Sequence.js"
import { Ordered, Unordered } from "./Ordered.js"

import { Description, Source, Title } from "../../codeblock/CodeBlockProps.js"

export type TitledStep<T extends Unordered | Ordered = Unordered> = Source &
  Title &
  Partial<Description> & { graph: Sequence<T> }

type TitledSteps<T extends Unordered | Ordered = Unordered> = T &
  Source &
  Title &
  Partial<Description> & {
    steps: TitledStep<T>[]
  }

export type OrderedTitledSteps = TitledSteps<Ordered>

export function isTitledSteps<T extends Unordered | Ordered = Unordered>(graph: Graph<T>): graph is TitledSteps<T> {
  const ts = graph as TitledSteps<T>
  return ts && typeof ts.title === "string" && Array.isArray(ts.steps)
}

function sameStep(A: TitledSteps["steps"][0], B: TitledSteps["steps"][0]) {
  return (
    A.title === B.title &&
    A.description === B.description &&
    A.graph.sequence.length === B.graph.sequence.length &&
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    A.graph.sequence.every((a, idx) => sameGraph(a, B.graph.sequence[idx]))
  )
}

export function sameTitledSteps(A: TitledSteps, B: TitledSteps) {
  return (
    A.title === B.title &&
    A.description === B.description &&
    A.steps.length === B.steps.length &&
    A.steps.every((a, idx) => sameStep(a, B.steps[idx]))
  )
}

export default TitledSteps
