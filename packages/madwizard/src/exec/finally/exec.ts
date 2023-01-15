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

import Debug from "debug"

import { Memos } from "../../memoization/index.js"
import { CustomExecutable } from "../../codeblock/index.js"

export function isFinallyPop(cmdline: string | boolean, exec?: CustomExecutable["exec"]): string | void {
  if (typeof cmdline === "string" && exec == "madwizard_finally_pop") {
    const match = cmdline.match(/^echo\s+madwizard_finally_pop\s+"(.+)"$/)
    if (match) {
      return match[1]
    }
  }
}

/** Runtime: Execute a push or pop at runtime */
export default function runtimeExecMadwizardFinally(
  cmdline: string | boolean,
  memos: Memos,
  exec?: CustomExecutable["exec"] /* execute code block with custom exec, rather than `sh` */
) {
  if (typeof cmdline === "string") {
    switch (exec) {
      case "madwizard_finally_push": {
        const match = cmdline.match(/^echo\s+madwizard_finally_push\s+"(.+)"$/)
        if (match) {
          const ctx = match[1]
          memos.finallyStack.push(ctx)
          Debug("madwizard/exec/finally/push")(ctx, memos.finallyStack)
          return "success" as const
        }
        break
      }

      case "madwizard_finally_pop": {
        const match = cmdline.match(/^echo\s+madwizard_finally_pop\s+"(.+)"$/)
        if (match) {
          const expectedCtx = memos.finallyStack[memos.finallyStack.length - 1]
          const actualCtx = match[1]
          if (expectedCtx !== actualCtx) {
            throw new Error(`RuntimeError: finally stack mismatch ${expectedCtx}!=${actualCtx} (expected!=actual)`)
          } else {
            memos.finallyStack.pop()
            Debug("madwizard/exec/finally/pop")(actualCtx, memos.finallyStack)
            return "success" as const
          }
        }
        break
      }
    }
  }
}
