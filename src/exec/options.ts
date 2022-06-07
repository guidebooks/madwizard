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

import { Memos } from "../memoization/index.js"

/** Environment variable state that might be mutated by the guidebook itself */
export type Env = Pick<Memos, "env">

export type ExecOptions = Partial<Env> &
  Partial<Pick<Memos, "dependencies" | "invalidate" | "subprocesses">> & {
    /** Do not emit to console */
    quiet?: boolean

    /** Capture stdout here */
    capture?: string

    /** Ignore stderr in capture? */
    ignoreStderr?: boolean
  }
