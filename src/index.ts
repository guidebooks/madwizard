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

// CLI
export * as CLI from "./fe/cli"

// UI support
export * as Tree from "./fe/tree"

// APIs
export * as Graph from "./graph"
export * as Parser from "./parser"
export * as Choices from "./choices"
export * as Wizard from "./wizard"
export * as CodeBlock from "./codeblock"

// Options
export * from "./fe"

// Version
export * from "./version"

// Reader
export async function reader() {
  return import("./fe/cli/madwizardRead").then((_) => _.madwizardRead)
}
