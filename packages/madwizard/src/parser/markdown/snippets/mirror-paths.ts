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

import { basename, dirname, join } from "path"

/**
 * We pre-parse the source into the `blocks` model (our AST). This
 * returns the location of the ast model associated with the given source `filepath`.
 */
export function targetPathForAst(filepath: string, storePrefix = "") {
  return join(storePrefix, dirname(filepath), basename(filepath, ".md") + "-madwizard.json")
}
