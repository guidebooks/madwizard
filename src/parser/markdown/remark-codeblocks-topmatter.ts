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
import { Node } from "hast"
import { Code } from "mdast"
import { visitParents } from "unist-util-visit-parents"

import dump from "./rehype-code-indexer/dump.js"
import { tryFrontmatter } from "./frontmatter/index.js"
import { isOnAnImportChain, visitImportContainers } from "./remark-import.js"
import KuiFrontmatter, { hasCodeBlocks } from "./frontmatter/KuiFrontmatter.js"

function isCode(node: Node): node is Code {
  return node.type === "code" && typeof (node as Code).value === "string"
}

/** Scan and process the `codeblocks` schema of the given `frontmatter` */
export function preprocessCodeBlocksInContent(
  tree /*: Root */,
  frontmatter: KuiFrontmatter,
  topmostFrontmatter?: KuiFrontmatter,
  currentImport?: Node
) {
  const debug = Debug("madwizard/topmatter/codeblocks")

  const codeblocksToUse = hasCodeBlocks(frontmatter)
    ? frontmatter.codeblocks
    : topmostFrontmatter && hasCodeBlocks(topmostFrontmatter)
    ? topmostFrontmatter.codeblocks
    : undefined

  debug("code block specs", codeblocksToUse || "none")

  if (codeblocksToUse) {
    const codeblocks = codeblocksToUse.map((_) => Object.assign({}, _, { match: new RegExp(_.match) }))

    visitParents(tree, "code", (node, ancestors) => {
      if (isCode(node)) {
        if (isOnAnImportChain(ancestors, currentImport)) {
          return
        }

        const matched = codeblocks.find((_) => _.match.test(node.value))

        if (!matched) {
          debug("no matches", node.value.slice(0, 30))
        } else if (matched) {
          if (matched.language) {
            // smash in a code block language (this would be the ```${language} part of the text)
            node.lang = matched.language
            debug("code block force language", matched.language)
          }

          if (matched.optional !== undefined || matched.validate || matched.cleanup) {
            const { body, attributes } = tryFrontmatter(node.value)

            attributes.optional = matched.optional

            if (matched.validate) {
              // smash in validation logic; this is done in the
              // topmatter of the code block, and parsed out by rehype-code-indexer

              if (matched.validate === "$body") {
                attributes.validate = body
              } else {
                attributes.validate = matched.validate
              }

              debug("validation:", `"${attributes.validate.slice(0, 30)}"`, `"${body.slice(0, 30)}"`)
            }

            if (matched.cleanup) {
              // smash in cleanup logic; this is done in the
              // topmatter of the code block, and parsed out by rehype-code-indexer
              attributes.cleanup = matched.cleanup
            }

            node.value = dump(attributes, body)
          }
        }
      }
    })
  }
}

/** Scan and process the `codeblocks` schema of the given `frontmatter` */
export function preprocessCodeBlocksInImports(tree /*: Root */, topmostFrontmatter: KuiFrontmatter) {
  visitImportContainers(tree, ({ node, frontmatter }) => {
    preprocessCodeBlocksInContent(node, frontmatter, topmostFrontmatter, node)
  })
}
