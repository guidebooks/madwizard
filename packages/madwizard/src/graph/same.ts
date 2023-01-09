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

import { Graph } from "./index.js"
import { isChoice, sameChoice } from "./nodes/Choice.js"
import { isSubTask, sameSubTask } from "./nodes/SubTask.js"
import { isSequence, sameSequence } from "./nodes/Sequence.js"
import { isParallel, sameParallel } from "./nodes/Parallel.js"
import { isTitledSteps, sameTitledSteps } from "./nodes/TitledSteps.js"

import { CodeBlockProps } from "../codeblock/CodeBlockProps.js"

function sameCodeBlock(a: CodeBlockProps, b: CodeBlockProps) {
  return (
    a.id === b.id &&
    a.validate === b.validate &&
    a.body === b.body &&
    a.language === b.language &&
    a.optional === b.optional
  )
}

export default function sameGraph(A: Graph, B: Graph) {
  if (isChoice(A)) {
    return isChoice(B) && sameChoice(A, B)
  } else if (isSequence(A)) {
    return isSequence(B) && sameSequence(A, B)
  } else if (isParallel(A)) {
    return isParallel(B) && sameParallel(A, B)
  } else if (isTitledSteps(A)) {
    return isTitledSteps(B) && sameTitledSteps(A, B)
  } else if (isSubTask(A)) {
    return isSubTask(B) && sameSubTask(A, B)
  } else {
    return !isChoice(B) && !isSequence(B) && !isParallel(B) && !isTitledSteps(B) && !isSubTask(B) && sameCodeBlock(A, B)
  }
}
