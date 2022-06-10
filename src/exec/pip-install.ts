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
import { CustomExecutable } from "../codeblock/index.js"

/**
 * Add the requirements.txt specified in cmdline
 */
export default function addPipDependences(
  cmdline: string | boolean,
  memos: Memos,
  exec?: CustomExecutable["exec"] /* execute code block with custom exec, rather than `sh` */
) {
  if (exec && typeof cmdline === "string" && /^\s*pip-install\s*$/.test(exec) && memos.dependencies) {
    if (!memos.dependencies.pip) {
      memos.dependencies.pip = []
    }

    cmdline
      .split(/\n/)
      .filter(Boolean)
      .forEach((_) => memos.dependencies.pip.push(_))
    return "success" as const
  }
}
