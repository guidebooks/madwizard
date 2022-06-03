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

import { Env, ExecOptions } from "./options"
import { CustomExecutable, SupportedLanguage, isPythonic, isShellish } from "../codeblock/index.js"

import shell from "./shell.js"
import which from "./which.js"
import custom from "./custom.js"
import python from "./python.js"
import pipShow from "./pip-show.js"
import raySubmit from "./ray-submit.js"
import exporter, { isExport } from "./export.js"

export { Env, ExecOptions, isExport }

/** Shell out the execution of the given `cmdline` */
export async function shellExec(
  cmdline: string | boolean,
  opts: ExecOptions = { quiet: false },
  language: SupportedLanguage = "shell",
  exec?: CustomExecutable["exec"] /* execute code block with custom exec, rather than `sh` */,
  async?: boolean /* fire and forget, until this process exits? */
): Promise<"success"> {
  if (exec) {
    // then the source has provided a custom executor
    return (await raySubmit(cmdline, opts, exec)) || custom(cmdline, opts, exec)
  } else if (isShellish(language)) {
    // then the code block has been declared with a `shell` or `bash`
    // or `sh` language
    return (
      exporter(cmdline, opts) || // export FOO=3
      which(cmdline) || // which foo
      pipShow(cmdline, opts) || // optimized pip show
      shell(cmdline, opts, undefined, async) // vanilla shell exec
    )
  } else if (isPythonic(language)) {
    // then the code block has been declared with a `python` language
    return python(cmdline, opts)
  } else {
    throw new Error("Unable to execute body in unsupported language: " + language)
  }
}

export async function shellExecToString(
  cmdline: string | boolean,
  _opts: ExecOptions = { quiet: false },
  language?: SupportedLanguage,
  exec?: CustomExecutable["exec"]
): Promise<string> {
  const opts = Object.assign({}, _opts, { capture: "", throwErrors: true })
  await shellExec(cmdline, opts, language, exec)
  return opts.capture
}
