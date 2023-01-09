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

import Choice from "./Choice.js"
import Sequence from "./Sequence.js"
import Parallel from "./Parallel.js"
import SubTask from "./SubTask.js"
import TitledSteps from "./TitledSteps.js"
import { Ordered, Unordered } from "./Ordered.js"

/** A non-leaf Graph node */
type InteriorNode<T extends Unordered | Ordered = Unordered> =
  | Choice<T>
  | Sequence<T>
  | Parallel<T>
  | SubTask<T>
  | TitledSteps<T>

export default InteriorNode
