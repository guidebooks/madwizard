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

import { compile } from "./graph"
import { blockify } from "./parser"
import { wizardify } from "./wizard"
import { newChoiceState } from "./choices"

export * from "./graph"
export * from "./parser"
export * from "./choices"
export * from "./wizard"

export default async function main(input: string, choices = newChoiceState()) {
  const { blocks } = await blockify(input, choices)
  const dag = compile(blocks, choices)
  const wizard = wizardify(dag, choices)

  return { blocks, dag, wizard, choices }
}
