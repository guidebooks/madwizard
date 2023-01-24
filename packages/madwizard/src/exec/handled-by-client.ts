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
import { ExecOptions } from "./options.js"

export default function handledByClient(cmdline: string | boolean, memos: Memos, opts: ExecOptions = { quiet: false }) {
  if (typeof opts.shell === "object" && opts.shell.willHandle(cmdline)) {
    return opts.shell.exec(cmdline, memos.env).then((response) => {
      if (typeof opts.capture === "string") {
        opts.capture = Array.isArray(response) ? response.join("\n") : response.toString()
      }
      return "success" as const
    })
  }
}
