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

import { MadWizardOptions } from ".."
import { ChoiceState } from "../choices"
import { CodeBlockProps } from "../codeblock"
import { Provenance, hasProvenance } from "./provenance"
import { CompileOptions, Graph, compile, nodes } from "."

/**
 * List the veto-able provenances. This can be used to help fill in
 * the `--veto` field of `MadWizardOptions`.
 */
export function vetoes(graph: Graph): Provenance["provenance"] {
  return Array.from(new Set(nodes(graph, hasProvenance).flatMap((_) => _.provenance)))
}

/**
 * List the veto-able provenances. This can be used to help fill in
 * the `--veto` field of `MadWizardOptions`.
 */
export async function vetoesFromBlocks(blocks: CodeBlockProps[], choices: ChoiceState, options: CompileOptions = {}) {
  const graph = await compile(blocks, choices, Object.assign({}, options, { optimize: false, expand: false }))
  return vetoes(graph)
}

export async function vetoesToString(blocks: CodeBlockProps[], choices: ChoiceState, options: MadWizardOptions = {}) {
  return (await vetoesFromBlocks(blocks, choices, Object.assign({}, options, { optimize: false })))
    .map((_) => (options.veto && options.veto.test(_) ? `${_} ${chalk.red("[VETOED]")}` : _))
    .join(EOL)
}
