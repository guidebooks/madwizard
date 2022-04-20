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

import chalk from "chalk"

import { prettyPrintUITree, Treeifier, AnsiUI } from "../tree"
import { blockify, wizardify, compile, order } from "../.."

export async function cli(argv: string[], write = process.stdout.write.bind(process.stdout)) {
  const task = argv[1]
  const input = argv[2]

  if (!task) {
    console.error(chalk.red("Please provide a task"))
    process.exit(1)
  } else if (task !== "tree" && task !== "wizard-raw") {
    console.error(chalk.red(`Invalid task: ${task}`))
    process.exit(1)
  }

  if (!input) {
    console.error(chalk.red("Please provide an input filepath or URI"))
    process.exit(1)
  }

  const { blocks, choices } = await blockify(input)
  const graph = compile(blocks, choices)

  if (task === "tree") {
    const tree = new Treeifier(new AnsiUI()).toTree(order(graph))
    prettyPrintUITree(tree, undefined, write)
  } else if (task === "wizard-raw") {
    const wizard = wizardify(graph, choices)
    console.log(JSON.stringify(wizard, undefined, 2))
  }
}
