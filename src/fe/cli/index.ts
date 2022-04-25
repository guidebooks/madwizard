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
import chalk from "chalk"
import { basename } from "path"

import { Guide } from "../guide"
import { parse, wizardify, compile, order } from "../.."
import { prettyPrintUITree, Treeifier, AnsiUI, DevNullUI } from "../tree"

export { Guide }

type Task = "tree" | "json" | "guide" | "timing"

function validTasks(): Task[] {
  return ["tree", "json", "guide", "timing"]
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
  console.error(`Usage: ${basename(argv[0])} ${validTasks().join("|")} <a filepath or url>`)
  process.exit(1)
}

export async function cli<Writer extends (msg: string) => boolean>(argv: string[], write?: Writer) {
  const task = argv[1]
  const input = argv[2]

  if (!task || !input) {
    return usage(argv)
  }

  if (!isValidTask(task)) {
    return usage(argv, `Invalid task: ${task}`)
  }

  if (task === "timing") {
    Debug.enable("madwizard/timing/*")
  }

  const { blocks, choices } = await parse(input)

  try {
    switch (task) {
      case "timing": {
        // print out timing
        const graph = compile(blocks, choices)
        wizardify(graph)
        new Treeifier(new DevNullUI()).toTree(order(graph))
        break
      }

      case "tree": {
        const graph = compile(blocks, choices)
        const tree = new Treeifier(new AnsiUI()).toTree(order(graph))
        prettyPrintUITree(tree, write)
        break
      }

      case "json": {
        const graph = compile(blocks, choices)
        const wizard = wizardify(graph)
        console.log(
          JSON.stringify(wizard, (key, value) => (key === "source" || key === "position" ? "placeholder" : value), 2)
        )
        break
      }

      case "guide":
        await new Guide(blocks, choices).run()
        break

      default:
        // if our switch isn't exhaustive, you will see this typescript error:
        // Argument of type 'string' is not assignable to parameter of type 'never'.
        assertExhaustive(task)
    }
  } catch (err) {
    console.log(err.message)
    process.exit(1)
  }
}
