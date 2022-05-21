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

import { EOL } from "os"
import Debug from "debug"

import usage from "./usage"
import { DebugTask, isDebugTask, isValidTask } from "./tasks"

import { MadWizardOptions } from "../MadWizardOptions"

function assertExhaustive(value: never, message = "Reached unexpected case in exhaustive switch"): never {
  throw new Error(message)
}

function enableTracing(task: DebugTask, subtask = "*") {
  Debug.enable(`madwizard/${task.replace(/^debug:/, "")}/${subtask}`)
}

export async function cli<Writer extends (msg: string) => boolean>(
  _argv: string[],
  write: Writer,
  providedOptions: MadWizardOptions = {}
) {
  const [
    { parse },
    { version },
    { wizardify },
    { newChoiceState },
    { madwizardRead },
    { compile, order, vetoesToString },
  ] = await Promise.all([
    import("../../parser"),
    import("../../version"),
    import("../../wizard"),
    import("../../choices"),
    import("./madwizardRead"),
    import("../../graph"),
  ])

  // TODO replace this with yargs or something like that
  const argv = _argv.filter((_, idx) => !/^-/.test(_) && (idx === 0 || !/^--/.test(_argv[idx - 1])))

  if (argv[1] === "version") {
    return version()
  }

  const task = !argv[2] ? "guide" : argv[1]
  const input = argv[2] || argv[1]

  const vetoIdx = _argv.findIndex((_) => new RegExp("^--veto=").test(_))
  const vetoStr = vetoIdx < 0 ? undefined : _argv[vetoIdx].slice(_argv[vetoIdx].indexOf("=") + 1)
  const veto = !vetoStr ? undefined : new RegExp(vetoStr)

  const mkdocsIdx = _argv.findIndex((_) => new RegExp("^--mkdocs=").test(_))
  const mkdocs = mkdocsIdx < 0 ? undefined : _argv[mkdocsIdx].slice(_argv[mkdocsIdx].indexOf("=") + 1)

  const narrow = !!_argv.find((_) => _ === "--narrow" || _ === "-n")

  const noOptimize = !!_argv.find((_) => _ === "-O0" || _ === "--optimize=0" || _ === "--no-optimize")
  const noAprioris = !!_argv.find((_) => _ === "--no-aprioris")
  const noValidate = !!_argv.find((_) => _ === "--no-validate")
  const optimize = noOptimize ? false : { aprioris: !noAprioris, validate: !noValidate }

  // base uri of guidebook store; this will allow users to type
  // shortnames for books in the store
  const store = _argv.find((_) => _.startsWith("--store="))
    ? _argv.find((_) => _.startsWith("--store=")).replace(/^--store=/, "")
    : undefined

  // assert a choice to have a given value
  const assertions = !_argv.find((_) => _.startsWith("--assert="))
    ? undefined
    : _argv
        .filter((_) => _.startsWith("--assert="))
        .map((_) => _.replace(/^--assert=/, ""))
        .map((_) => _.split(/=/))
        .reduce((M, [key, value]) => {
          M[key] = value
          return M
        }, {})

  const commandLineOptions: MadWizardOptions = { veto, mkdocs, narrow, optimize, store }
  const options: MadWizardOptions = Object.assign(commandLineOptions, providedOptions)

  if (!task || !input) {
    return usage(argv)
  }

  if (!isValidTask(task)) {
    return usage(argv, `Invalid task: ${task}`)
  }

  if (isDebugTask(task)) {
    enableTracing(task)
  }

  const choices = newChoiceState(assertions)

  // build and mirror: these allow for static/ahead-of-time fetching
  // and inlining of content. This can be helpful to allow shipping
  // "frozen" forms of content with a build, and capturing remote
  // content at the same time. By inlining the content ("build", and
  // mirror calls build over a directory tree), you can also amortize
  // the cost of many file reads/remote fetches per run.
  if (task === "build") {
    const { inliner } = await import("../../parser/markdown/snippets/inliner")
    await inliner(input, argv[3], argv[4])
    return
  } else if (task === "mirror") {
    const { mirror } = await import("../../parser/markdown/snippets/mirror")
    await mirror(input, argv[3])
    return
  }

  const { blocks } = await parse(input, madwizardRead, choices, undefined, options)

  switch (task) {
    case "version":
      break

    case "debug:graph":
    case "debug:topmatter":
      // these tasks depend only on `parse` having been called
      break

    case "debug:groups":
    case "debug:timing":
    case "debug:fetch": {
      // print out timing
      const graph = await compile(blocks, choices, options)
      wizardify(graph)

      await import("../tree").then((_) => new _.Treeifier(new _.DevNullUI()).toTree(order(graph)))
      break
    }

    case "plan":
      await import("../tree").then((_) =>
        _.prettyPrintUITreeFromBlocks(blocks, choices, Object.assign({ write }, options))
      )
      break

    case "vetoes":
      (write || process.stdout.write.bind(process.stdout))(await vetoesToString(blocks, choices, options))
      break

    case "json": {
      const graph = await compile(blocks, choices, options)
      const wizard = await wizardify(graph)
      ;(write || process.stdout.write.bind(process.stdout))(
        JSON.stringify(
          wizard,
          (key, value) => {
            if (key === "source" || key === "position") {
              return "placeholder"
            } else if (key === "key" || key === "id") {
              return "somekey"
            } else if (key === "description" && !value) {
              return undefined
            } else if (key === "nesting" && Array.isArray(value)) {
              return undefined
            } else if (key === "barrier" && value === false) {
              return undefined
            } else if (key === "status" && value === "blank") {
              return undefined
            } else {
              return value
            }
          },
          2
        ) + EOL
      )
      break
    }

    case "run":
    case "guide": {
      const Guide = await import("../guide").then((_) => _.Guide)
      await new Guide(task, blocks, choices, options).run()
      break
    }

    default:
      // if our switch isn't exhaustive, you will see this typescript error:
      // Argument of type 'string' is not assignable to parameter of type 'never'.
      assertExhaustive(task)
  }
}
