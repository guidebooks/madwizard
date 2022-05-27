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
import { ExecOptions } from "./options"
import custom, { CustomEnv } from "./custom"

type Pip = {
  pip: string[]
}
type Conda = {
  conda: Record<string, any>
}

/** express any pip dependencies we have collected */
function pipsJson(opts: ExecOptions): Partial<Pip> {
  const pips = new Set(!opts.dependencies || !opts.dependencies.pip ? [] : opts.dependencies.pip)
  pips.delete("ray")

  return pips.size === 0 ? {} : { pip: Array.from(pips) }
}

async function condaJson(condaFilepath: string): Promise<Conda> {
  const [{ readFile }, { load }] = await Promise.all([import("fs"), import("js-yaml")])

  return new Promise((resolve, reject) => {
    readFile(condaFilepath, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve({ conda: load(data.toString()) })
      }
    })
  })
}

async function saveEnvToFile(
  parsedOptions: ReturnType<typeof import("yargs-parser")>,
  opts: ExecOptions,
  customEnv: CustomEnv
) {
  const deps = parsedOptions.conda ? await condaJson(parsedOptions.conda) : pipsJson(opts)

  const runtimeEnv: Record<string, any> = Object.assign(
    {
      working_dir: customEnv.MWDIR,
    },
    deps
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
            resolve(filepath)
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
export default async function raySubmit(cmdline: string | boolean, opts: ExecOptions, exec: string) {
  if (typeof cmdline === "string") {
    const prefix = /\s*ray-submit/
    if (prefix.test(exec)) {
      // authors could have `exec: ...ourCustomExec...`, but that's
      // long and tedious to maintain in every guidebook; this
      // executor allows them to type `exec: ray-submit` as a
      // shorthand.
      //
      // Note: in guidebook source, only one \" is needed.
      // Here, we need \\" just to make nodejs's parser happy.

      return custom(cmdline, opts, async (customEnv) => {
        // anything after `ray-submit` will be tacked on to the `ray
        // submit` command line
        const parsedOptions = await import("yargs-parser").then((_) =>
          _.default(exec, { configuration: { "populate--": true } })
        )
        const extraArgs = exec
          .replace(prefix, "")
          .replace(/--base-image=\S+/g, "")
          .replace(/--conda=\S+/g, "")
          .replace(/ -- .+$/, "")

        const envFile = await saveEnvToFile(parsedOptions, opts, customEnv)

        // formulate a ray job submit command line; `custom` will
        // assemble ` working directory `$MWDIR` and `$MWFILENAME`
        const cmdline = `ray job submit --runtime-env=${envFile} ${extraArgs} -- python3 ${
          customEnv.MWFILENAME
        } ${parsedOptions["--"].join(" ")}`
        Debug("madwizard/exec/ray-submit")("options", parsedOptions)
        Debug("madwizard/exec/ray-submit")("cmdline", cmdline)
        return cmdline
      })
    }
  }

  return undefined
}
