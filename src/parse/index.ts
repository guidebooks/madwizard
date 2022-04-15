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

import { VFile } from 'vfile'
import { v4 } from 'uuid'
import {unified, PluggableList} from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'

import CodeBlockProps from '../codeblock/CodeBlockProps'

import hackSource from './hack'

// GitHub Flavored Markdown plugin; see https://github.com/IBM/kui/issues/6563
import gfm from 'remark-gfm'

// parses out ::import{filepath} as node.type === 'leafDirective', but
// does not create any DOM elements
import remarkDirective from 'remark-directive'

// import inlineSnippets from '../../../controller/snippets'

import emojis from 'remark-emoji'
import frontmatter from 'remark-frontmatter'

import tip from './rehype-tip'
import tabbed from './rehype-tabbed'

import wizard from './rehype-wizard'
import rehypeImports, { remarkImports } from './remark-import'

import codeIndexer from './rehype-code-indexer'

// react-markdown v6+ now require use of these to support html
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'

import icons from './rehype-icons'
import { kuiFrontmatter } from './frontmatter'

const remarkPlugins = (): PluggableList => [
  gfm,
  remarkDirective,
  remarkImports,
  [frontmatter, ['yaml', 'toml']],
  [kuiFrontmatter],
  emojis
]

const rehypePlugins = (uuid: string, codeblocks: CodeBlockProps[]): PluggableList => [
  wizard,
  [tabbed, uuid],
  tip,
  [codeIndexer, uuid, codeblocks],
  rehypeImports,
  icons,
  rehypeRaw,
  rehypeSlug
]

export default function parse(input: VFile, uuid = v4()) {
  const codeblocks: CodeBlockProps[] = []

  const processor = unified()
    .use(remarkParse)
    .use(remarkPlugins())
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypePlugins(uuid, codeblocks))

  return {
    codeblocks,
    ast: processor.run(processor.parse(hackSource(input.value.toString()))),
  }
}
