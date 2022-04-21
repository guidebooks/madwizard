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

import { UITree } from "../tree"

const Symbols = {
  ansi: {
    BRANCH: "├── ",
    LAST_BRANCH: "└── ",
    VERTICAL: "│   ",
    EMPTY: "",
    INDENT: "    ",
  },
}

export function prettyPrintUITree(
  graph: UITree<string>,
  write = process.stdout.write.bind(process.stdout),
  symbols = Symbols.ansi,
  prefix = "",
  depth = 0,
  isLast = false
) {
  write(prefix)

  if (depth >= 1) {
    write(isLast ? symbols.LAST_BRANCH : symbols.BRANCH)
  }

  const nextPrefix = depth >= 1 ? (isLast ? symbols.INDENT : symbols.VERTICAL) : symbols.EMPTY

  graph.forEach((node) => {
    write((node.name || node.title) + "\n")

    if (node.children) {
      node.children.forEach((child, idx, A) =>
        prettyPrintUITree([child], write, symbols, prefix + nextPrefix, depth + 1, idx === A.length - 1)
      )
    }
  })
}
