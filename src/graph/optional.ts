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

import { Graph, isChoice, isSequence, isParallel, isSubTask, isTitledSteps } from "."

export function isOptional(graph: Graph) {
  if (isSequence(graph)) {
    return graph.sequence.every(isOptional)
  } else if (isParallel(graph)) {
    return graph.parallel.every(isOptional)
  } else if (isSubTask(graph)) {
    return isOptional(graph.graph)
  } else if (isChoice(graph)) {
    return graph.choices.every((_) => isOptional(_.graph))
  } else if (isTitledSteps(graph)) {
    return graph.steps.every((_) => isOptional(_.graph))
  } else {
    return graph.optional
  }
}
