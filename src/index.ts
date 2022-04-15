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

import { inspect } from 'util'

import url from 'url'
import { VFile } from 'vfile'
import { read } from 'to-vfile'

import parse from './parse'

export async function mdwiz(input: VFile, uuid?: string) {
  const ast = await parse(input, uuid)

  console.log(inspect(ast, { colors: true, depth: null }))
}

export default async function main(argv = process.argv) {
  const input = argv[2]
  await mdwiz(await read(input))
}

if (import.meta.url.startsWith(url.pathToFileURL(process.argv[1]).href)) {
  main(process.argv)
}
