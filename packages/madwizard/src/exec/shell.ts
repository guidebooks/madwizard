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
import { spawn, execSync, StdioOptions } from "child_process"

import EarlyExit from "./EarlyExit.js"
import { ExecOptions } from "./options.js"
import { Memos } from "../memoization/index.js"
import { guidebookGlobalDataPath, guidebookProfileDataPath, guidebookJobDataPath } from "../profiles/index.js"

export function shellSync(cmdline: string, memos: Memos) {
  execSync(cmdline, { env: Object.assign({}, process.env, memos.env || {}) })
}

/** Restructure a Record<string,string> into [{name: string, value: string}] */
function toNameValue(env: Memos["env"]) {
  return Object.entries(env).map(([name, value]) => ({ name, value }))
}

/**
 * Keeping this pretty simple for now. The `shell-escape` npm
 * introduces superfluous single quotes, e.g. foo+bar becomes
 * 'foo+bar'. Normally, this would not be an issue. Howver, for some
 * reason, if a guidebook has `torchx run --env
 * $GUIDEBOOK_ENV_COMMAS`, then the single quotes are not removed,
 * leading to e.g. python code seeing the single quotes. So... for
 * now, let's try to side-step that. This needs more
 * investigation.
 */
function shellEscape(str: string) {
  if (/\s/.test(str) && !/^['"][^'"]+['"]$/.test(str)) {
    return `"${str}"`
  } else {
    return str
  }
}

/** Restructure a Record<string,string> into [{name: string, value: string}] */
function toCommaSeparated(env: Memos["env"]) {
  return Object.entries(env)
    .filter(([, value]) => value.length > 0 && !/[= ]/.test(value)) // TORCHX HACK; it has parsing errors with these
    .map(([name, value]) => name + "=" + shellEscape(value))
    .join(",")
}

type Spawned = { child: ReturnType<typeof spawn>; resultPromise: Promise<"success"> }

/** Shell out the execution of the given `cmdline` */
function shellItOut(
  _cmdline: string | boolean,
  memos: Memos,
  opts: ExecOptions = { quiet: false },
  extraEnv: Record<string, string> = {},
  async?: boolean /* fire and forget, until this process exits? */,
  needsStdin?: boolean /* attach stdin? */,
  onClose?: () => void | Promise<void> /* callback when the process exits */
): Spawned {
  const cmdline = typeof _cmdline === "boolean" ? _cmdline : _cmdline.replace(/\\\n/g, " ")

  // capture stdout into opts.capture
  const capture = typeof opts.capture === "string"

  // location for guidebooks to store non-profile-specific data
  const GUIDEBOOK_GLOBAL_DATA_PATH = guidebookGlobalDataPath(opts)

  // location for guidebooks to store profile-specific data
  const GUIDEBOOK_PROFILE_DATA_PATH = guidebookProfileDataPath(opts)

  // location for guidebooks to store job-specific data
  const GUIDEBOOK_JOB_DATA_PATH = guidebookJobDataPath(opts)

  const env = Object.assign(
    {
      TERM: "xterm-256color",
      IBMCLOUD_VERSION_CHECK: "false",
      HOMEBREW_NO_INSTALL_CLEANUP: "1",
      HOMEBREW_NO_INSTALL_UPGRADE: "1",
      HOMEBREW_NO_INSTALLED_DEPENDENTS_CHECK: "1",
      GUIDEBOOK_GLOBAL_DATA_PATH,
      GUIDEBOOK_PROFILE_DATA_PATH,
      GUIDEBOOK_JOB_DATA_PATH,
      GUIDEBOOK_ENV: Buffer.from(JSON.stringify(toNameValue(memos.env))).toString("base64"),
      GUIDEBOOK_ENV_COMMAS: toCommaSeparated(memos.env),
    },
    process.env,
    memos.env || {},
    extraEnv
  )

  if (opts.verbose) {
    env.GUIDEBOOK_VERBOSE = "true"
  }

  if (memos.cliDashDash) {
    env.GUIDEBOOK_DASHDASH = memos.cliDashDash.map(shellEscape).join(" ")
  }

  // unless the code block has a `shell.stdin` or `bash.stdin`, we
  // will not pass it our stdin; this is to avoid ctrl+z and laptop
  // suspend/resume from interfering with code block executions in
  // bizarre ways. NOTE: we pass "pipe" rather than "ignore", because
  // the latter can break certain applications, such as `websocat`,
  // which apparently fails silently if it has no stdin
  const stdin = needsStdin ? "inherit" : "pipe"

  const stdio: StdioOptions = opts.quiet
    ? [stdin, "ignore", "pipe"]
    : capture
    ? [stdin, "pipe", "pipe"]
    : [stdin, "inherit", "inherit"]
  if (opts.write) {
    stdio[1] = "pipe"
  }

  // re: setopts, by default zsh does not do word splitting on
  // unquoted variable expansions.
  // https://stackoverflow.com/questions/6715388/variable-expansion-is-different-in-zsh-from-that-in-bash
  const shell = process.env.SHELL || (process.platform === "win32" ? "pwsh" : "bash")
  const setopts = /zsh/.test(shell) ? "setopt SH_WORD_SPLIT;" : ""
  const argv = ["-c", process.platform === "win32" ? cmdline.toString() : `set -o pipefail; ${setopts} ${cmdline}`]
  Debug("madwizard/exec/shell")("shell", shell)
  Debug("madwizard/exec/shell")("argv", argv)

  const child = spawn(shell, argv, {
    env,
    detached: async, // see Memoizer.cleanup() for asyncs, we detach and then kill that detached process group
    stdio,
    windowsHide: true, // don't pop up a bash.exe window
  })

  const resultPromise = new Promise<"success">((resolve, reject) => {
    try {
      child.on("error", async (err) => {
        if (onClose) {
          await onClose()
        }
        reject(err)
      })

      let err = ""
      let out = ""
      child.on("close", async (code) => {
        memos.markDone(child)

        if (capture) {
          opts.capture = out
        }

        if (onClose) {
          await onClose()
        }

        if (code === 90) {
          reject(EarlyExit())
        } else if (code === 0) {
          resolve("success")
        } else {
          const msg = (err || `${cmdline} failed`).split(/\n/)[0].replace(/^\s*#\s*/, "") // first line, remove comment # prefix
          reject(new Error(msg))
        }
      })

      if (opts.quiet) {
        child.stderr.on("data", (data) => (err += data.toString()))
      }

      if (capture) {
        if (opts.throwErrors) {
          child.stderr.on("data", (data) => (err += data.toString()))
        } else if (!opts.ignoreStderr) {
          child.stderr.on("data", (data) => (out += data.toString()))
        }
        child.stdout.on("data", (data) => (out += data.toString()))
      } else if (opts.write) {
        // sending the stream to a custom consumer, mostly for tests
        child.stdout.on("data", (data) => opts.write(data.toString()))
      }

      memos.subprocesses.push(child)
      if (async) {
        resolve("success")
      }
    } catch (err) {
      reject(err)
    }
  })

  return { child, resultPromise }
}

/** Shell out the execution of the given `cmdline` */
export default async function shellItOutWithSuccess(
  _cmdline: string | boolean,
  memos: Memos,
  opts: ExecOptions = { quiet: false },
  extraEnv: Record<string, string> = {},
  isAsync?: boolean /* fire and forget, until this process exits? */,
  needsStdin?: boolean /* attach stdin? */,
  onClose?: () => void | Promise<void> /* callback when the process exits */
): Promise<"success"> {
  const { resultPromise } = shellItOut(_cmdline, memos, opts, extraEnv, isAsync, needsStdin, onClose)
  return resultPromise.then(() => "success")
}
