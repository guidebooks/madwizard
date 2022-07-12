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
import { v4 } from "uuid"
import expandHomeDir from "expand-home-dir"
import { VFile, VFileCompatible } from "vfile"

import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified, PluggableList } from "unified"

import { MadWizardOptions } from "../../fe/index.js"
import { Reader, fetcherFor } from "./fetch.js"

import { ChoiceState } from "../../choices/index.js"
import { CodeBlockProps } from "../../codeblock/index.js"

import { hackMarkdownSource } from "./hack.js"

// parses out ::import{filepath} as node.type === 'leafDirective', but
// does not create any DOM elements
import remarkDirective from "remark-directive"

import inlineSnippets from "./snippets/index.js"
import { toRawGithubUserContent } from "./snippets/urls.js"

import frontmatter from "remark-frontmatter"

import { rehypeTip } from "./rehype-tip/index.js"
import { rehypeTabbed } from "./rehype-tabbed/index.js"

import { rehypeWizard } from "./rehype-wizard.js"
import rehypeImports, { remarkImports } from "./remark-import.js"

import { rehypeCodeIndexer } from "./rehype-code-indexer/index.js"

// react-markdown v6+ now require use of these to support html
// import rehypeRaw from "rehype-raw"
// import rehypeSlug from "rehype-slug"

// import icons from "./rehype-icons"
import { kuiFrontmatter } from "./frontmatter/index.js"

export * from "./hack.js"
export * from "./fetch.js"
export * from "./rehype-tip/index.js"
export * from "./rehype-tabbed/index.js"
export * from "./rehype-wizard.js"
export * from "./rehype-code-indexer/index.js"

const remarkPlugins = (): PluggableList => [
  remarkDirective,
  remarkImports,
  [frontmatter, ["yaml", "toml"]],
  [kuiFrontmatter],
]

const rehypePlugins = (
  uuid: string,
  choices: ChoiceState,
  codeblocks: CodeBlockProps[],
  madwizardOptions: MadWizardOptions,
  filepath: string
): PluggableList => [
  rehypeWizard,
  [rehypeTabbed, uuid, choices, madwizardOptions],
  rehypeTip,
  [rehypeCodeIndexer, uuid, filepath, codeblocks],
  rehypeImports,
]

/** Parse the given `input` into a `Graph` syntax tree. */
async function parse(
  input: VFile,
  reader: Reader,
  choices: ChoiceState,
  uuid = v4(),
  madwizardOptions: MadWizardOptions = {}
) {
  const debug = Debug("madwizard/timing/parser:markdown")
  debug("start")

  try {
    const blocks: CodeBlockProps[] = []

    const processor = unified()
      .use(remarkParse)
      .use(remarkPlugins())
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypePlugins(uuid, choices, blocks, madwizardOptions, input.path))

    const fetcher = fetcherFor(reader, madwizardOptions.store, true)

    debug("fetch start")
    const sourcePriorToInlining = input.value.toString()
    const source = await inlineSnippets({ fetcher, madwizardOptions })(sourcePriorToInlining, input.path)
    debug("fetch complete")

    debug("parse start")
    const rawAst = processor.parse(hackMarkdownSource(source))
    debug("parse complete")

    debug("processor start")
    const ast = await processor.run(rawAst)
    debug("processor complete")

    return {
      choices,
      blocks,
      ast,
    }
  } finally {
    debug("complete")
  }
}

/** Parse the given `input` into a `Graph` syntax tree. */
export async function blockify(
  input: VFileCompatible,
  reader: Reader,
  choices?: ChoiceState,
  uuid?: string,
  madwizardOptions: MadWizardOptions = {}
) {
  const file =
    typeof input === "string"
      ? await reader(
          new VFile({ cwd: process.cwd(), path: toRawGithubUserContent(expandHomeDir(input)) }),
          madwizardOptions.store,
          true
        )
      : new VFile(input)
  return parse(file, reader, choices, uuid, madwizardOptions)
}
