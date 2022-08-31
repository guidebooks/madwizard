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
import expandHomeDir from "expand-home-dir"
import { access, readFile } from "fs/promises"

import { shellSync } from "./shell.js"
import { ExecOptions } from "./options.js"
import { Memos } from "../memoization/index.js"
import custom, { CustomEnv } from "./custom.js"
import { copyChoices } from "../profiles/index.js"

type ParsedOptions = ReturnType<typeof import("yargs-parser")>

interface RuntimeEnvDependencies {
  pip?: string[]
  conda?: {
    dependencies: (string | { pip: string[] })[]
  }
}

/** Expand env vars */
export function expand(expr: string | number, memos: Memos): string {
  return typeof expr === "undefined"
    ? expr
    : typeof expr !== "string"
    ? expr.toString()
    : expr.replace(/\${?([^}/\s]+)}?/g, (_, p1) =>
        expandHomeDir(
          typeof memos.env[p1] !== "undefined"
            ? memos.env[p1]
            : typeof process.env[p1] !== "undefined"
            ? process.env[p1]
            : _
        )
      )
}

/** Maybe the working directory as a requirements.txt? */
async function addPipsFromTemplate(pips: Set<string>, parsedOptions: ParsedOptions, memos: Memos) {
  if (parsedOptions["working-dir"]) {
    const workingDirPips = join(expand(parsedOptions["working-dir"], memos), "requirements.txt")
    if (
      await access(workingDirPips)
        .then(() => true)
        .catch(() => false)
    ) {
      try {
        const pipsFromWorkingDir = await readFile(workingDirPips).then((data) =>
          data.toString().split(/\n/).filter(Boolean)
        )
        pipsFromWorkingDir.forEach((pip) => pips.add(pip))
      } catch (err) {
        console.error("Error reading requirements.txt", err)
      }
    }
  }
}

/** Maybe the working directory has a runtime-env.yaml we can use? */
async function readRuntimeEnvFromTemplate(parsedOptions, memos: Memos) {
  if (parsedOptions["working-dir"]) {
    const workingDirRuntimeEnv = join(expand(parsedOptions["working-dir"], memos), "runtime-env.yaml")
    if (
      await access(workingDirRuntimeEnv)
        .then(() => true)
        .catch(() => false)
    ) {
      // then the working dir has a runtime env that we can use
      return import("js-yaml").then(async (_) => _.load((await readFile(workingDirRuntimeEnv)).toString()))
    }
  }
}

/** express any pip dependencies we have collected */
async function dependencies(memos: Memos, parsedOptions: ParsedOptions): Promise<RuntimeEnvDependencies> {
  const pips = new Set(!memos.dependencies || !memos.dependencies.pip ? [] : memos.dependencies.pip)
  await addPipsFromTemplate(pips, parsedOptions, memos)
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
  parsedOptions: ParsedOptions,
  memos: Memos,
  customEnv: CustomEnv
): Promise<{ filepath: string; runtimeEnv: Record<string, any> }> {
  // we cannot pass through a PATH, because this affects program
  // visibility in the ray workers; keep it as __PATH for debugging
  const curatedEnvVars = Object.assign({ __PATH: memos.env.PATH }, memos.env)
  delete curatedEnvVars.PATH

  const runtimeEnv: Record<string, any> = Object.assign(
    {},
    await dependencies(memos, parsedOptions),
    (await readRuntimeEnvFromTemplate(parsedOptions, memos)) || {},
    {
      env_vars: curatedEnvVars,
      working_dir: customEnv.MWDIR,
    }
  )

  if (parsedOptions["working-dir"]) {
    runtimeEnv["working_dir"] = expand(parsedOptions["working-dir"], memos)
  }

  /* if (parsedOptions["base-image"]) {
    runtimeEnv.container = {
      image: expand(parsedOptions["base-image"], memos),
    }
  } */

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
  language: string,
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
        cb: (signal?: "SIGINT" | "SIGTERM") => {
          if (signal) {
            // only stop the ray job if we got an interrupt or
            // termination request; if this is a normal exit, at the
            // end of the run, no need (and might be dangerous) to try
            // to stop the job.
            shellSync("ray job stop ${JOB_ID}", memos)
          }
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
            .replace(/--no-input/g, "")
            .replace(/--base-image=\S+/g, "")
            .replace(/--working-dir=\S+/g, "")
            .replace(/--entrypoint="[^"]*"+/g, "")
            .replace(/--entrypoint=\S+/g, "")
            .replace(/ -- .+$/, "")

          const { filepath: envFile, runtimeEnv } = await saveEnvToFile(parsedOptions, memos, customEnv)

          // ./custom.ts will populate this env var
          const inputFile = expand(parsedOptions.entrypoint, memos) || customEnv.MWFILENAME

          // arguments after the --
          const dashDash = parsedOptions["--"] ? parsedOptions["--"].map((_) => expand(_, memos)).join(" ") : ""

          // formulate a ray job submit command line; `custom` will
          // assemble ` working directory `$MWDIR` and `$MWFILENAME`
          const python = language === "python" || /\.py$/.test(inputFile) ? "python3" : "" // FIXME generalize this
          const systemPart = `ray job submit --runtime-env=${envFile} ${extraArgs}`
          const appPart = `${python} ${parsedOptions.input === false ? "" : inputFile} ${dashDash}`
          const cmdline = `${systemPart} -- ${appPart}`
          Debug("madwizard/exec/ray-submit")("env", memos.env || {})
          Debug("madwizard/exec/ray-submit")("options", parsedOptions)
          Debug("madwizard/exec/ray-submit")("cmdline", cmdline)
          Debug("madwizard/exec/ray-submit")("runtimeEnv", runtimeEnv || {})

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
