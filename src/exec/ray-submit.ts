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
import { join } from "path"

import { shellSync } from "./shell.js"
import { ExecOptions } from "./options.js"
import { Memos } from "../memoization/index.js"
import custom, { CustomEnv } from "./custom.js"
import { copyChoices } from "../profiles/index.js"

interface RuntimeEnvDependencies {
  pip?: string[]
  conda?: {
    dependencies: (string | { pip: string[] })[]
  }
}

/** express any pip dependencies we have collected */
function dependencies(memos: Memos): RuntimeEnvDependencies {
  const pips = new Set(!memos.dependencies || !memos.dependencies.pip ? [] : memos.dependencies.pip)
  pips.delete("ray")

  const condas = new Set(!memos.dependencies || !memos.dependencies.conda ? [] : memos.dependencies.conda)

  if (condas.size === 0 && pips.size === 0) {
    return {}
  } else if (condas.size === 0) {
    return { pip: Array.from(pips) }
  } else {
    if (pips.size > 0) {
      condas.add("pip")
    }

    const dependencies: RuntimeEnvDependencies["conda"]["dependencies"] = Array.from(condas)

    if (pips.size > 0) {
      dependencies.push({
        pip: Array.from(pips),
      })
    }

    return {
      conda: { dependencies },
    }
  }
}

async function saveEnvToFile(
  parsedOptions: ReturnType<typeof import("yargs-parser")>,
  memos: Memos,
  customEnv: CustomEnv
): Promise<{ filepath: string; runtimeEnv: Record<string, any> }> {
  const runtimeEnv: Record<string, any> = Object.assign(
    {
      env_vars: memos.env,
      working_dir: customEnv.MWDIR,
    },
    dependencies(memos)
  )

  if (parsedOptions["base-image"]) {
    runtimeEnv.container = {
      image: parsedOptions["base-image"],
    }
  }

  const [{ tmpName }, { writeFile }, { dump }] = await Promise.all([import("tmp"), import("fs"), import("js-yaml")])
  return new Promise((resolve, reject) => {
    tmpName((err, filepath) => {
      if (err) {
        reject(err)
      } else {
        writeFile(filepath, dump(runtimeEnv), (err) => {
          if (err) {
            reject(err)
          } else {
            resolve({ filepath, runtimeEnv })
          }
        })
      }
    })
  })
}

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
export default async function raySubmit(
  cmdline: string | boolean,
  memos: Memos,
  opts: ExecOptions,
  exec: string,
  async?: boolean
) {
  if (typeof cmdline === "string" && !opts.dryRun) {
    const prefix = /\s*ray-submit/
    if (prefix.test(exec)) {
      // authors could have `exec: ...ourCustomExec...`, but that's
      // long and tedious to maintain in every guidebook; this
      // executor allows them to type `exec: ray-submit` as a
      // shorthand.
      //
      // Note: in guidebook source, only one \" is needed.
      // Here, we need \\" just to make nodejs's parser happy.

      // make sure to kill the ray job before we go
      memos.onExit.push({
        name: "stop ray job",
        cb: () => {
          shellSync("ray job stop ${JOB_ID}", memos)
        },
      })

      const source = cmdline
      return custom(
        cmdline,
        memos,
        opts,
        async (customEnv) => {
          // anything after `ray-submit` will be tacked on to the `ray
          // submit` command line
          const parsedOptions = await import("yargs-parser").then((_) =>
            _.default(exec, { configuration: { "populate--": true } })
          )
          const extraArgs = exec
            .replace(prefix, "")
            .replace(/--base-image=\S+/g, "")
            .replace(/ -- .+$/, "")

          const { filepath: envFile, runtimeEnv } = await saveEnvToFile(parsedOptions, memos, customEnv)

          // ./custom.ts will populate this env var
          const inputFile = customEnv.MWFILENAME

          // arguments after the --
          const dashDash = parsedOptions["--"] ? parsedOptions["--"].join(" ") : ""

          // formulate a ray job submit command line; `custom` will
          // assemble ` working directory `$MWDIR` and `$MWFILENAME`
          const systemPart = `ray job submit --runtime-env=${envFile} ${extraArgs}`
          const appPart = `python3 ${inputFile} ${dashDash}`
          const cmdline = `${systemPart} -- ${appPart}`
          Debug("madwizard/exec/ray-submit")("env", memos.env || {})
          Debug("madwizard/exec/ray-submit")("options", parsedOptions)
          Debug("madwizard/exec/ray-submit")("cmdline", cmdline)

          // save a job.json to the staging directory
          if (memos.env.LOGDIR_STAGE) {
            // intentionally async'd here with no await... this may
            // cause problems with super-short runs? so far it seems
            // to be ok.
            new Promise<void>((resolve, reject) => {
              copyChoices(join(memos.env.LOGDIR_STAGE, "choices.json"), opts)

              import("fs").then((_) =>
                _.writeFile(
                  join(memos.env.LOGDIR_STAGE, "job.json"),
                  JSON.stringify(
                    {
                      jobid: memos.env.JOB_ID,
                      cmdline: {
                        appPart,
                        systemPart,
                      },
                      runtimeEnv,
                      language: "python",
                      source,
                    },
                    (key, value) => (/SECRET_ACCESS|ACCESS_KEY|PASSWORD/i.test(key) ? "********" : value),
                    2
                  ),
                  (err) => {
                    if (err) {
                      reject(err)
                    } else {
                      resolve()
                    }
                  }
                )
              )
            })
          }

          return cmdline
        },
        async
      )
    }
  }

  return undefined
}
