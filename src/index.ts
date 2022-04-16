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

import { inspect } from "util"
import { read } from "to-vfile"

import ChoiceState from "./choices/impl"

import * as Parser from "./parse"
export { Parser }

import * as Dag from "./dag"
export { Dag }

import * as Wizard from "./wizard"
export { Wizard }

export default async function main(argv = process.argv, choices = new ChoiceState()) {
  const input = argv[2]
  const blocks = Parser.blockify(await read(input))
  const dag = Dag.daggify(blocks, choices)
  const wizard = Wizard.wizardify(dag, choices)

  console.log(inspect(wizard, { colors: true, depth: null }))

  return { blocks, dag, wizard }
}

//if (import.meta.url.startsWith(pathToFileURL(process.argv[1]).href)) {
if (import.meta.url.startsWith("file:")) {
  main(process.argv)
}
