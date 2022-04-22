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

import { VFileCompatible } from "vfile"

import { compile } from "../graph"
import { blockify } from "../parser"
import { wizardify } from "../wizard"
import { newChoiceState } from "../choices"

/**
 * This is mostly a demonstration front-end. Most users should invoke
 * the underlying APIs directly.
 */
export async function main(input: VFileCompatible, choices = newChoiceState()) {
  const { blocks } = await blockify(input, choices)
  const graph = compile(blocks, choices)
  const wizard = wizardify(graph)

  return { blocks, graph, wizard, choices }
}
