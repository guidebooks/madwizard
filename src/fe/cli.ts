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

import {
  blockify,
  wizardify,
  compile,
  subtask,
  hasTitle,
  extractTitle,
  Graph,
  isSequence,
  isParallel,
  isChoice,
  isSubTask,
  isTitledSteps,
} from ".."

/** TODO make this a parameter to prettyPrint */
const MAX_LINE_WIDTH = 80

const Symbols = {
  ansi: {
    BRANCH: "├── ",
    LAST_BRANCH: "└── ",
    VERTICAL: "│   ",
    EMPTY: "",
    INDENT: "    ",
  },
}

function dress(str: string) {
  return str === "Prerequisites" || str === "Main Tasks" ? chalk.yellow(str) : chalk.blue(str)
}

function prettyPrint(
  graph: Graph,
  symbols = Symbols.ansi,
  out = process.stdout,
  prefix = "",
  depth = 0,
  isLast = false
) {
  out.write(prefix)

  if (depth >= 1) {
    out.write(isLast ? symbols.LAST_BRANCH : symbols.BRANCH)
  }

  const nextPrefix = depth >= 1 ? (isLast ? symbols.INDENT : symbols.VERTICAL) : symbols.EMPTY

  if (isSequence(graph)) {
    graph.sequence.forEach((_, idx, A) => {
      prettyPrint(_, symbols, out, nextPrefix, depth, idx === A.length - 1)
    })
  } else if (isParallel(graph)) {
    graph.parallel.forEach((_, idx, A) => {
      prettyPrint(_, symbols, out, nextPrefix, depth + 1, idx === A.length - 1)
    })
  } else if (isSubTask(graph)) {
    const title =
      graph.graph.sequence.length === 1 && extractTitle(graph.graph.sequence[0]) === graph.title
        ? "┐"
        : depth === 0
        ? chalk.bold(graph.title)
        : dress(graph.title)
    out.write(title + "\n")
    graph.graph.sequence.forEach((_, idx, A) => {
      prettyPrint(_, symbols, out, prefix + nextPrefix, depth + 1, idx === A.length - 1)
    })
  } else if (isTitledSteps(graph)) {
    out.write(dress(graph.title) + "\n")
    graph.steps.forEach((_, idx, A) => {
      if (hasTitle(_.graph)) {
        prettyPrint(_.graph, symbols, out, prefix + nextPrefix, depth + 1, idx === A.length - 1)
      } else {
        prettyPrint(
          subtask(_.title, _.title, "", "", _.graph),
          symbols,
          out,
          prefix + nextPrefix,
          depth + 1,
          idx === A.length - 1
        )
      }
    })
  } else if (isChoice(graph)) {
    out.write(graph.title + "\n")

    graph.choices.forEach((_, idx, A) => {
      const option = chalk.cyan(`Option ${idx + 1}`) + `: ${_.title}`
      prettyPrint(
        subtask(option, option, "", "", _.graph),
        symbols,
        out,
        prefix + nextPrefix,
        depth + 1,
        idx === A.length - 1
      )
    })
  } else {
    out.write(chalk.magenta.dim(graph.body.slice(0, Math.min(40, MAX_LINE_WIDTH - nextPrefix.length))) + "\n")
  }
}

export async function cli(argv: string[]) {
  const task = argv[1]
  const input = argv[2]

  if (!task) {
    console.error(chalk.red("Please provide a task"))
    process.exit(1)
  }

  if (!input) {
    console.error(chalk.red("Please provide an input filepath or URI"))
    process.exit(1)
  }

  const { blocks, choices } = await blockify(input)
  const graph = compile(blocks, choices)

  if (task === "tree") {
    prettyPrint(graph)
  } else if (task === "wizard-raw") {
    const wizard = wizardify(graph, choices)
    console.log(JSON.stringify(wizard, undefined, 2))
  } else {
    console.error(chalk.red(`Invalid task: ${task}`))
    process.exit(1)
  }
}
