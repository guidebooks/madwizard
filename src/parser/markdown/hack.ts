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

// ==foo== -> <mark>foo</mark>
import hackMarks from "./remark-mark.js"

// ++ctrl+alt+delete++== -> <kbd>ctrl</kbd>+<kbd>alt</kbd>+<kbd>delete</kbd>
import hackKeys from "./remark-keys.js"

// support pymdown's indentation-based tab and tip blocking
import hackIndentation from "./rehype-tabbed/hack.js"

export function hackMarkdownSource(source: string) {
  return hackKeys(hackMarks(hackIndentation(source)))
    .trim()
    .replace(/\){target=[^}]+}/g, ")")
    .replace(/{draggable=(false|true)}/g, "")
}
