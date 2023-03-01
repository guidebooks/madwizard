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
import { join, resolve } from "path"
import shellEscape from "shell-escape"
import expandHomeDir from "expand-home-dir"
import { access, readFile } from "fs/promises"

import shellItOut from "./shell.js"
import { ExecOptions } from "./options.js"
import { Memos } from "../memoization/index.js"
import { copyChoices } from "../profiles/index.js"

type ParsedOptions = ReturnType<typeof import("yargs-parser")>

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
async function readPipsFromWorkingDir(parsedOptions: ParsedOptions, memos: Memos) {
  if (parsedOptions["working-dir"]) {
    const workingDirPips = resolve(join(expand(parsedOptions["working-dir"], memos), "requirements.txt"))
    if (
      await access(workingDirPips)
        .then(() => true)
        .catch(() => false)
    ) {
      try {
        const pipsFromWorkingDir = await readFile(workingDirPips).then((data) =>
          data.toString().split(/\n/).filter(Boolean)
        )
        return { pip: pipsFromWorkingDir }
      } catch (err) {
        console.error("Error reading requirements.txt", err)
      }
    }
  }
}

/** Maybe the working directory has a runtime-env.yaml we can use? */
async function readRuntimeEnvFromWorkingDir(parsedOptions, memos: Memos) {
  if (parsedOptions["working-dir"]) {
    const workingDirRuntimeEnv = resolve(join(expand(parsedOptions["working-dir"], memos), "runtime-env.yaml"))
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

async function saveEnvToFile(
  parsedOptions: ParsedOptions,
  memos: Memos
): Promise<{
  localWorkingDir: string
  remoteWorkingDir
  remoteRuntimeEnvFilepath: string
  runtimeEnv: Record<string, any>
}> {
  // we cannot pass through a PATH, because this affects program
  // visibility in the ray workers; keep it as __PATH for debugging
  const curatedEnvVars = Object.assign({ __PATH: memos.env.PATH }, memos.env)
  delete curatedEnvVars.PATH
  delete curatedEnvVars.RAY_ADDRESS

  const remoteWorkingDir = join("/tmp", memos.env.JOB_ID)
  const localWorkingDir = resolve(expand(parsedOptions["working-dir"], memos))

  const runtimeEnv: Record<string, any> = Object.assign(
    {},
    await readPipsFromWorkingDir(parsedOptions, memos),
    (await readRuntimeEnvFromWorkingDir(parsedOptions, memos)) || {},
    {
      env_vars: curatedEnvVars,
      working_dir: remoteWorkingDir,
    }
  )

  if (!parsedOptions["working-dir"]) {
    throw new Error("Missing working directory")
  }

  const [{ writeFile }, { dump }] = await Promise.all([import("fs"), import("js-yaml")])
  return new Promise((resolve, reject) => {
    const envFile = "__runtime_env.yaml"
    const filepath = join(localWorkingDir, envFile)
    const remoteRuntimeEnvFilepath = join(remoteWorkingDir, envFile)
    writeFile(filepath, dump(runtimeEnv), (err) => {
      if (err) {
        reject(err)
      } else {
        resolve({ localWorkingDir, remoteWorkingDir, remoteRuntimeEnvFilepath, runtimeEnv })
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
  const source = cmdline

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

      const { localWorkingDir, remoteWorkingDir, remoteRuntimeEnvFilepath, runtimeEnv } = await saveEnvToFile(
        parsedOptions,
        memos
      )

      // ./custom.ts will populate this env var
      const inputFile = expand(parsedOptions.entrypoint, memos)

      // arguments after the --
      const dashDash = parsedOptions["--"] ? shellEscape(parsedOptions["--"].map((_) => expand(_, memos))) : ""

      // Use `kubectl cp` to transfer the working directory to the head pod
      // ASSUMES: ml/ray/cluster/head has been run (this gives us RAY_HEAD_POD)
      await shellItOut(
        `kubectl cp ${memos.env.KUBE_CONTEXT_ARG} ${memos.env.KUBE_NS_ARG} "${localWorkingDir}" ${memos.env.RAY_HEAD_POD}:${remoteWorkingDir}`,
        memos,
        opts
      )

      // formulate a ray job submit command line; `custom` will
      // assemble ` working directory `$MWDIR` and `$MWFILENAME`
      const python = language === "python" || /\.py$/.test(inputFile) ? "python3" : "" // FIXME generalize this
      const systemPart = `ray job submit --address=http://localhost:8265 --working-dir=${remoteWorkingDir} --runtime-env=${remoteRuntimeEnvFilepath} ${extraArgs}`
      const appPart = `${python} ${parsedOptions.input === false ? "" : inputFile} ${dashDash}`
      const cmdline = `${systemPart} -- ${appPart}`
      Debug("madwizard/exec/ray-submit")("env", memos.env || {})
      Debug("madwizard/exec/ray-submit")("options", parsedOptions)
      Debug("madwizard/exec/ray-submit")("cmdline", cmdline)
      Debug("madwizard/exec/ray-submit")("runtimeEnv", runtimeEnv || {})

      // Use `kubectl exec` to issue the `ray job start` cmdline on the head pod
      // ASSUMES: ml/ray/cluster/head has been run (this gives us RAY_HEAD_POD)
      const promise = shellItOut(
        `kubectl exec -i -t ${memos.env.KUBE_CONTEXT_ARG} ${memos.env.KUBE_NS_ARG} ${memos.env.RAY_HEAD_POD} -- ${cmdline}`,
        memos,
        opts,
        undefined,
        async
      )

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

      await promise
      return "success" as const
    }
  }

  return undefined
}
