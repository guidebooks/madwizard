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

import { UITree } from "../tree"
import { MadWizardOptions } from "../.."

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
  write: typeof process.stdout.write
  symbols?: typeof Symbols.ansi
}

type State = {
  depth: number
  prefix: string
  isLast: boolean
}

export function prettyPrintUITree(
  graph: UITree<string>,
  options: PrettyPrintOptions & MadWizardOptions,
  { depth, prefix, isLast }: State = { depth: 0, prefix: "", isLast: false }
) {
  const { write = process.stdout.write.bind(process.stdout), symbols = Symbols.ansi, narrow } = options

  write(prefix)

  if (depth >= 1) {
    write(isLast ? symbols.LAST_BRANCH : symbols.BRANCH)
  }

  const nextPrefix = depth >= 1 ? (isLast ? symbols.INDENT : symbols.VERTICAL) : symbols.EMPTY

  graph.forEach((node) => {
    const name = node.name || node.title

    if (narrow) {
      const remaining = Math.max(10, process.stdout.columns - prefix.length)
      const ellipsis = remaining < name.length ? "\u2026" : ""
      write(name.slice(0, remaining).replace(/\n.*$/, "") + ellipsis + EOL)
    } else {
      write(name.replace(new RegExp(EOL, "g"), EOL + prefix + nextPrefix) + EOL)
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
