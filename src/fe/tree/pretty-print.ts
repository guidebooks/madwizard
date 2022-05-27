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
import chalk from "chalk"

import { Memoizer } from "../../memoization/index.js"
import { ChoiceState } from "../../choices/index.js"
import { compile, order } from "../../graph/index.js"
import { CodeBlockProps } from "../../codeblock/index.js"
import { AnsiUI, Treeifier, UITree } from "../tree/index.js"
import { MadWizardOptions } from "../MadWizardOptions.js"

const Symbols = {
  ansi: {
    BRANCH: "├── ",
    LAST_BRANCH: "└── ",
    VERTICAL: "│   ",
    EMPTY: "",
    INDENT: "    ",
  },
}

type PrettyPrintOptions = {
  write?: typeof process.stdout.write
  symbols?: typeof Symbols.ansi
  skipFirstTitle?: boolean
  indent?: string
}

type State = {
  depth: number
  prefix: string
  isLast: boolean
}

function defaultWriteStream() {
  return process.stdout.write.bind(process.stdout)
}

export function elide(str: string, soFarOnLine = 0) {
  const remaining = Math.max(10, process.stdout.columns - soFarOnLine)
  const ellipsis = remaining < str.length ? chalk.dim("\u2026") : ""
  return str.slice(0, remaining).replace(/[\n\r][\S\s]*$/, "") + chalk.reset(ellipsis)
  // re: the chalk.reset; this is to conservatively assume that the
  // given `str` has ANSI escape codes that we might have
  // cropped. Since we desire no decoration for the ellipsis? I think
  // this might be the simplest way to achieve what we need. But it's
  // possible that there may be an enclosing escape sequence that we
  // will reset? The alternatives are: either chalk.reset(" ") which
  // introduces another space; or we could detect the situation more
  // deeply.
}

export function prettyPrintUITree(
  graph: UITree<string>,
  options: PrettyPrintOptions & MadWizardOptions,
  { depth, prefix, isLast }: State = { depth: 0, prefix: "", isLast: false }
) {
  const { write = defaultWriteStream(), symbols = Symbols.ansi, narrow, indent = "" } = options

  write(indent)
  write(prefix)

  if (depth >= 1) {
    write(isLast ? symbols.LAST_BRANCH : symbols.BRANCH)
  }

  const nextPrefix = depth >= 1 ? (isLast ? symbols.INDENT : symbols.VERTICAL) : symbols.EMPTY

  graph.forEach((node) => {
    const name = node.name || node.title || ""

    if (narrow) {
      write(elide(name, indent.length + prefix.length) + EOL)
    } else {
      write(name.replace(new RegExp(EOL, "g"), EOL + indent + prefix + nextPrefix) + EOL)
    }

    if (node.children) {
      node.children.forEach((child, idx, A) =>
        prettyPrintUITree([child], options, {
          prefix: prefix + nextPrefix,
          depth: depth + 1,
          isLast: idx === A.length - 1,
        })
      )
    }
  })
}

export async function prettyPrintUITreeFromBlocks(
  blocks: CodeBlockProps[],
  choices: ChoiceState,
  options: PrettyPrintOptions & MadWizardOptions & { root?: string } = {}
) {
  const memos = new Memoizer()
  const graph = await compile(blocks, choices, Object.assign({}, memos, options))

  const treeifier = new Treeifier(new AnsiUI(), memos.statusMemo)
  const tree = treeifier.toTree(order(graph))

  if (options.skipFirstTitle) {
    const children = tree.flatMap((_) => _.children)
    if (options.root) {
      prettyPrintUITree(treeifier.treeOf(options.root, children), options)
    } else {
      children.map((_) => prettyPrintUITree([_], options))
    }
  } else {
    prettyPrintUITree(options.root ? treeifier.treeOf(options.root, tree) : tree, options)
  }

  return graph
}
