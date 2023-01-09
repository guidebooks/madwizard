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

export function parallel(parallel: Graph[]): Parallel {
  return {
    key: v4(),
    parallel,
  }
}

type Parallel<T extends Unordered | Ordered = Unordered> = T &
  Key & {
    parallel: Graph<T>[]
  }

export type OrderedParallel = Parallel<Ordered>

export function isParallel<T extends Unordered | Ordered = Unordered>(graph: Graph<T>): graph is Parallel<T> {
  return graph && Array.isArray((graph as Parallel).parallel)
}

export function sameParallel(A: Parallel, B: Parallel) {
  return (
    A.parallel.length === B.parallel.length &&
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    A.parallel.every((a, idx) => sameGraph(a, B.parallel[idx]))
  )
}

export default Parallel
