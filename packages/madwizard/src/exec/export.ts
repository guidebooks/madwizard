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

import chalk from "chalk"
import shellItOut from "./shell.js"
import { Memos } from "../memoization"
import { ExecOptions } from "./options.js"

function _isExport(cmdline: string): ReturnType<string["match"]> {
  return cmdline.match(/^\s*(export|unset)\s+([^=]+)=?/)
}

/** Is the given `cmdline` of the form `export foo=bar`? */
export function isExport(cmdline: string): boolean {
  // TODO suboptimal (match versus test)
  return !!_isExport(cmdline)
}

/** See if we are being asked to execute `export FOO=bar` */
export default function execAsExport(cmdline: string | boolean, memos: Memos, opts: ExecOptions) {
  if (memos.env && typeof cmdline === "string") {
    const match = _isExport(cmdline)
    if (match) {
      const semicolon = /;\s*$/.test(cmdline) ? "" : ";"
      const [, op, key] = match

      // invalidate any memos using this shell variable, since we're
      // about to update it
      memos.invalidate(key)

      //
      const options = Object.assign({}, opts, { capture: "", ignoreStderr: true, write: undefined })

      // we need to use the shell not only to give us the exported
      // value, but also the exported key! e.g. someone might have
      // `export FOO${BAR}=$(do something)`; here, the key has a
      // variable expansion, and the value has a subprocess execution;
      // so we formulate a `magicCmdLine` to give us both the
      // `keyForUpdate` and the `valueForUpdate`
      const magicCmdline = `${cmdline}${semicolon} echo "${key}"; printenv ${key}`

      return shellItOut(magicCmdline, memos, options)
        .then(() => options.capture.split(/\n/).filter(Boolean))
        .catch(() => [key, ""])
        .then(([keyForUpdate, valueForUpdate = ""]) => {
          if (op === "unset") {
            // for unset foo, we only need the invalidate part
            if (opts.verbose && !opts.quiet) {
              console.error(chalk.dim.yellow(`Unsetting ${keyForUpdate}`))
            }

            delete memos.env[key] // TODO, move this to memos.invalidate()?
            return "success"
          } else {
            if (opts.verbose && !opts.quiet) {
              console.error(chalk.dim.yellow(`Setting ${keyForUpdate}=${valueForUpdate}`))
            }

            memos.env[keyForUpdate] = valueForUpdate
            return "success" as const
          }
        })
    }
  }
}
