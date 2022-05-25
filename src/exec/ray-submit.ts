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

import custom from "./custom"
import { ExecOptions } from "./options"

/**
 * This is purely syntactic sugar, a wrapper over `custom` executor
 * that saves the guidebook authors from having to repeat the
 * following `ourCustomExec` boilerplate in every ray submit code
 * block. Instead, guidebook authors can use:
 *
 * ```python
 * ---
 * exec: ray-submit --job-id ${uuid}
 * ---
 * someFancyPythonCode()
 * ```
 *
 */
export default function raySubmit(cmdline: string | boolean, opts: ExecOptions, exec: string) {
  if (typeof cmdline === "string") {
    const match = exec.match(/^\s*ray-submit(.*)$/)
    if (match) {
      // authors could have `exec: ...ourCustomExec...`, but that's
      // long and tedious to maintain in every guidebook; this
      // executor allows them to type `exec: ray-submit` as a
      // shorthand.
      //
      // Note: in guidebook source, only one \" is needed.
      // Here, we need \\" just to make nodejs's parser happy.

      // anything after `ray-submit` will be tacked on to the `ray
      // submit` command line
      const extraArgs = match[1] || ""

      // express any pip dependencies we have collected
      const pips = new Set(!opts.dependencies || !opts.dependencies.pip ? [] : opts.dependencies.pip)
      pips.delete("ray")
      pips.delete("torch")
      const pipsJson =
        pips.size === 0
          ? ""
          : `, \\"pip\\": [${Array.from(pips)
              .map((_) => `\\"${_}\\"`)
              .join(",")}]`

      // formulate a ray job submit command line; `custom` will
      // assemble ` working directory `$MWDIR` and `$MWFILENAME`
      const ourCustomExec = `ray job submit --runtime-env-json="{\\"working_dir\\": \\"$MWDIR\\"${pipsJson}}" ${extraArgs} -- python3 "$MWFILENAME"`

      // and then execute it
      return custom(cmdline, opts, ourCustomExec)
    }
  }
}
