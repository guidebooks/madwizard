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

import { read } from "to-vfile"
import { VFileCompatible } from "vfile"
import { extname as pathExtname } from "path"

import { ChoiceState } from "../choices"

export * from "./markdown"

/** @return the file extension for the given `input` */
function extname(input: VFileCompatible) {
  if (typeof input === "string") {
    return pathExtname(input)
  } else if (Buffer.isBuffer(input)) {
    throw new Error("Unsupported input: Buffer")
  } else if ("extname" in input) {
    return input.extname
  } else if (input instanceof URL) {
    return pathExtname(input.pathname)
  }
}

/** Parse the given `input` into a `Graph` syntax tree. */
export async function parse(input: VFileCompatible, choices?: ChoiceState, uuid?: string, reader?: typeof read) {
  const ext = extname(input)
  if (ext === ".md") {
    return await import("./markdown").then((_) => _.blockify(input, choices, uuid, reader))
  } else {
    throw new Error(`Unsupported file type: ${String(input)}`)
  }
}
