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
import needle from "needle"
import expandHomeDir from "expand-home-dir"
import { read as vfileRead } from "to-vfile"
import { VFile, VFileCompatible } from "vfile"

import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified, PluggableList } from "unified"

import { MadWizardOptions } from "../../"

import { CodeBlockProps } from "../../codeblock"
import { ChoiceState, newChoiceState } from "../../choices"

import { hackMarkdownSource } from "./hack"

// parses out ::import{filepath} as node.type === 'leafDirective', but
// does not create any DOM elements
import remarkDirective from "remark-directive"

import inlineSnippets from "./snippets"

import frontmatter from "remark-frontmatter"

import { rehypeTip } from "./rehype-tip"
import { rehypeTabbed } from "./rehype-tabbed"

import wizard from "./rehype-wizard"
import rehypeImports, { remarkImports } from "./remark-import"

import { rehypeCodeIndexer } from "./rehype-code-indexer"

// react-markdown v6+ now require use of these to support html
// import rehypeRaw from "rehype-raw"
// import rehypeSlug from "rehype-slug"

// import icons from "./rehype-icons"
import { kuiFrontmatter } from "./frontmatter"

export * from "./hack"
export * from "./rehype-tip"
export * from "./rehype-tabbed"
export * from "./rehype-code-indexer"

const remarkPlugins = (): PluggableList => [
  remarkDirective,
  remarkImports,
  [frontmatter, ["yaml", "toml"]],
  [kuiFrontmatter],
]

const rehypePlugins = (uuid: string, choices: ChoiceState, codeblocks: CodeBlockProps[]): PluggableList => [
  wizard,
  [rehypeTabbed, uuid, choices],
  rehypeTip,
  [rehypeCodeIndexer, uuid, codeblocks],
  rehypeImports,
  // icons,
  // rehypeRaw,
  // rehypeSlug,
]

async function read(file: VFile): Promise<VFile> {
  if (/^https?:/.test(file.path)) {
    const { statusCode, body } = await needle("get", file.path)
    file.value = body
    if (statusCode !== 200) {
      throw new Error(body)
    } else {
      return file
    }
  } else {
    return vfileRead(file)
  }
}

/** Parse the given `input` into a `Graph` syntax tree. */
async function parse(
  input: VFile,
  choices: ChoiceState = newChoiceState(),
  uuid = v4(),
  reader = read,
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
      .use(rehypePlugins(uuid, choices, blocks))

    const fetcher = (filepath: string) => reader(new VFile({ path: filepath })).then((_) => _.value.toString())

    debug("fetch start")
    const sourcePriorToInlining = input.value.toString()
    const source = await inlineSnippets({ fetcher, madwizardOptions })(sourcePriorToInlining, input.path)
    debug("fetch complete")

    debug("parse start")
    const rawAst = processor.parse(hackMarkdownSource(source))
    debug("parse complete")

    debug("processor start")
    const ast = processor.run(rawAst)
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
  choices?: ChoiceState,
  uuid?: string,
  reader = read,
  madwizardOptions?: MadWizardOptions
) {
  const file = typeof input === "string" ? await reader(new VFile({ path: expandHomeDir(input) })) : new VFile(input)
  return parse(file, choices, uuid, reader, madwizardOptions)
}
