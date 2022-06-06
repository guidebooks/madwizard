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

import { spawn } from "child_process"
import { ExecOptions } from "./options.js"

/** Shell out the execution of the given `cmdline` */
export default async function shellItOut(
  cmdline: string | boolean,
  opts: ExecOptions = { quiet: false },
  extraEnv: Record<string, string> = {},
  async?: boolean /* fire and forget, until this process exits? */
): Promise<"success"> {
  const capture = typeof opts.capture === "string"

  const env = Object.assign(
    {
      IBMCLOUD_VERSION_CHECK: "false",
      HOMEBREW_NO_INSTALL_CLEANUP: "1",
      HOMEBREW_NO_INSTALL_UPGRADE: "1",
      HOMEBREW_NO_INSTALLED_DEPENDENTS_CHECK: "1",
    },
    process.env,
    opts.env || {},
    extraEnv
  )

  return new Promise((resolve, reject) => {
    const child = spawn(
      process.env.SHELL || (process.platform === "win32" ? "pwsh" : "bash"),
      ["-c", process.platform === "win32" ? cmdline.toString() : `set -o pipefail; ${cmdline}`],
      {
        env,
        detached: async, // see Memoizer.cleanup() for asyncs, we detach and then kill that detached process group
        stdio: opts.quiet
          ? ["inherit", "ignore", "pipe"]
          : capture
          ? ["inherit", "pipe", "pipe"]
          : ["inherit", "inherit", "inherit"],
      }
    )

    child.on("error", reject)

    let err = ""
    let out = ""
    child.on("close", (code) => {
      if (capture) {
        opts.capture = out
      }

      if (code === 0) {
        resolve("success")
      } else {
        reject(new Error(err || `${cmdline} failed`))
      }
    })

    if (opts.quiet) {
      child.stderr.on("data", (data) => (err += data.toString()))
    }

    if (capture) {
      child.stderr.on("data", (data) => (out += data.toString()))
      child.stdout.on("data", (data) => (out += data.toString()))
    }

    if (async) {
      opts.subprocesses.push(child)
      resolve("success")
    }
  })
}
