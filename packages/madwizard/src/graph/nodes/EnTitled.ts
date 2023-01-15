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

import { basename } from "path"

import Graph from "../Graph.js"
import { seq } from "./Sequence.js"
import LeafNode from "./LeafNode.js"
import { isChoice } from "./Choice.js"
import { hasFilepath } from "./Filepath.js"
import { isTitledSteps } from "./TitledSteps.js"
import { subtask, isSubTask } from "./SubTask.js"
import { Description, FinallyFor, Source, Title } from "../../codeblock/CodeBlockProps.js"

/** A way of titling a task or choice */
type EnTitled = Title & Partial<Description> & Partial<Source> & Partial<FinallyFor>

/** @return a `Graph` that inherits the given `EnTitled` properties */
export function withTitle(block: LeafNode, { title, description, source, isFinallyFor }: EnTitled, barrier = false) {
  return subtask(title, title, title, description, "", seq(block), source, barrier, undefined, isFinallyFor)
}

export function hasTitleProperty(graph: Graph): graph is Graph & Title & Partial<Description> {
  return isTitledSteps(graph) || isSubTask(graph) || isChoice(graph)
}

export function hasTitle(graph: Graph): graph is Graph & Title & Partial<Description> {
  return hasTitleProperty(graph) && !!graph.title
}

export function extractTitle(graph: Graph) {
  if (hasTitle(graph)) {
    return graph.title
  } else if (isSubTask(graph) && graph.graph.sequence.length === 1 && hasTitleProperty(graph.graph.sequence[0])) {
    // Heuristic: in the case that this `graph` is a thin wrapper over
    // some other SubTask, and this graph does not have an explicit
    // `title` property, favor whatever title we can extract from the
    // inner subtask. This will make the models shown in `guide
    // foo.md` compatible with those shown in `replay foo.md`.
    return extractTitle(graph.graph.sequence[0])
  } else if (hasFilepath(graph)) {
    return basename(graph.filepath)
  }
}

function hasDescriptionProperty(graph: Graph): graph is Graph & Description {
  return isTitledSteps(graph) || isSubTask(graph)
}

export function extractDescription(graph: Graph) {
  if (hasDescriptionProperty(graph)) {
    return graph.description
  }
}

export default EnTitled
