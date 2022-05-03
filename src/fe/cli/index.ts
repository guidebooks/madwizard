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
import chalk from "chalk"
import { basename } from "path"

import { MadWizardOptions } from "../MadWizardOptions"

import { Guide } from "../guide"
import { parse, wizardify, compile, order } from "../.."
import { prettyPrintUITreeFromBlocks, Treeifier, DevNullUI } from "../tree"

export { Guide }

type Task = "tree" | "json" | "guide" | "timing" | "fetch" | "topmatter" | "groups"

function validTasks(): Task[] {
  return ["tree", "json", "guide", "timing", "fetch", "topmatter", "groups"]
}

function isDebugTask(task: Task) {
  return task === "timing" || task === "fetch" || task === "topmatter" || task === "groups"
}

function isValidTask(task: string): task is Task {
  return validTasks().includes(task as Task)
}

function assertExhaustive(value: never, message = "Reached unexpected case in exhaustive switch"): never {
  throw new Error(message)
}

function usage(argv: string[], msg?: string) {
  if (msg) {
    console.error(chalk.red(msg))
  }
  console.error(
    `${chalk.bold.yellow("Usage:")} ${basename(argv[0]).replace(/\.js$/, "")} ${chalk.cyan(
      validTasks().join("|")
    )} <a filepath or url>`
  )
  process.exit(1)
}

function enableTracing(task: Task, subtask = "*") {
  Debug.enable(`madwizard/${task}/${subtask}`)
}

export async function cli<Writer extends (msg: string) => boolean>(
  _argv: string[],
  write?: Writer,
  providedOptions: MadWizardOptions = {}
) {
  // TODO replace this with yargs or something like that
  const argv = _argv.filter((_, idx) => !/^-/.test(_) && (idx === 0 || !/^--/.test(_argv[idx - 1])))
  const task = argv[1]
  const input = argv[2]
  const mkdocsIdx = _argv.findIndex((_) => _ === "--mkdocs")
  const mkdocs = mkdocsIdx < 0 ? undefined : _argv[mkdocsIdx + 1]
  const narrow = !!_argv.find((_) => _ === "--narrow" || _ === "-n")
  const noOptimize = !!_argv.find((_) => _ === "-O0" || _ === "--optimize=0" || _ === "--no-optimize")
  const noAprioris = !!_argv.find((_) => _ === "--no-aprioris")

  const optimize = noOptimize ? false : { aprioris: !noAprioris }
  const options = Object.assign({}, { mkdocs, narrow, optimize }, providedOptions)

  if (!task || !input) {
    return usage(argv)
  }

  if (!isValidTask(task)) {
    return usage(argv, `Invalid task: ${task}`)
  }

  try {
    if (isDebugTask(task)) {
      enableTracing(task)
    }

    const { blocks, choices } = await parse(input, undefined, undefined, undefined, options)

    switch (task) {
      case "groups":
      case "topmatter":
        break

      case "timing":
      case "fetch": {
        // print out timing
        const graph = await compile(blocks, choices, options)
        wizardify(graph)
        new Treeifier(new DevNullUI()).toTree(order(graph))
        break
      }

      case "tree": {
        await prettyPrintUITreeFromBlocks(blocks, choices, Object.assign({ write }, options))
        break
      }

      case "json": {
        const graph = await compile(blocks, choices)
        const wizard = await wizardify(graph)
        ;(write || process.stdout.write.bind(process.stdout))(
          JSON.stringify(
            wizard,
            (key, value) => {
              if (key === "source" || key === "position") {
                return "placeholder"
              } else if (key === "description" && !value) {
                return undefined
              } else if (key === "nesting" && Array.isArray(value)) {
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

      case "guide":
        await new Guide(blocks, choices, options).run()
        break

      default:
        // if our switch isn't exhaustive, you will see this typescript error:
        // Argument of type 'string' is not assignable to parameter of type 'never'.
        assertExhaustive(task)
    }
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}
