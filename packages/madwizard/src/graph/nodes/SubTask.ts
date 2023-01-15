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
import Filepath from "./Filepath.js"
import Sequence from "./Sequence.js"
import { TitledStep } from "./TitledSteps.js"
import Graph, { sameGraph } from "../Graph.js"
import { Ordered, Unordered } from "./Ordered.js"

import {
  Barrier,
  Description,
  IdempotencyGroup,
  FinallyFor,
  Source,
  Title,
  Validatable,
} from "../../codeblock/CodeBlockProps.js"

type SubTask<T extends Unordered | Ordered = Unordered> = Key &
  Source &
  Filepath &
  Title &
  Partial<Description> &
  Partial<Barrier> &
  Partial<FinallyFor> &
  Partial<Validatable> &
  Partial<IdempotencyGroup> &
  T & {
    /** The nested graph that this SubTask wraps */
    graph: Sequence<T>
  }

export type OrderedSubTask = SubTask<Ordered>

export type FinallySubTask<T extends Unordered | Ordered = Unordered> = SubTask<T> & Required<FinallyFor>
export type NormalSubTask<T extends Unordered | Ordered = Unordered> = SubTask<T>

export function subtask<T extends Unordered | Ordered = Unordered>(
  key: string,
  group: string,
  title: string,
  description: string,
  filepath: string,
  graph: Sequence<T>,
  source: Source["source"],
  barrier = false,
  validate?: Validatable["validate"],
  isFinallyFor?: string
): SubTask<Unordered> {
  const subtask: SubTask<Unordered> = {
    key,
    group,
    title,
    description,
    filepath,
    graph,
    source,
    barrier,
    validate,
  }

  if (isFinallyFor) {
    subtask.isFinallyFor = isFinallyFor
  }

  return subtask
}

export function asSubTask(step: TitledStep): SubTask {
  return subtask(v4(), step.title, step.title, step.description, "", step.graph, step.source)
}

export function isSubTask<T extends Unordered | Ordered = Unordered>(graph: Graph<T>): graph is SubTask<T> {
  const subtask = graph as SubTask
  return subtask && typeof subtask.key === "string" && typeof subtask.filepath === "string"
}

export function isNormalSubTask<T extends Unordered | Ordered = Unordered>(graph: Graph<T>): graph is SubTask<T> {
  return isSubTask(graph) && !graph.isFinallyFor
}

export function isFinallySubTask<T extends Unordered | Ordered = Unordered>(
  graph: Graph<T>
): graph is FinallySubTask<T> {
  return isSubTask<T>(graph) && !!graph.isFinallyFor
}

export function isSubTaskWithFilepath<T extends Unordered | Ordered = Unordered>(
  graph: Graph<T>
): graph is SubTask<T> & { filepath: string } {
  return isSubTask(graph) && !!graph.filepath
}

/** @return whether `A` and `B` are identical `Graph` */
export function sameSubTask(A: SubTask, B: SubTask) {
  return (
    /* A.key === B.key &&*/ A.title === B.title &&
    A.description === B.description &&
    A.filepath === B.filepath &&
    A.barrier === B.barrier &&
    sameGraph(A.graph, B.graph) // eslint-disable-line @typescript-eslint/no-use-before-define
  )
}

/**
 * Morph the given FinallySubTask to behave like a regular
 * SubTask. This is useful when finally (hehe) executing the finally
 * block.
 *
 */
export function asNormalSubTask(A: FinallySubTask) {
  return Object.assign({}, A, { isFinallyFor: undefined })
}

export default SubTask
