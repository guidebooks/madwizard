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

import ChoiceStateImpl from "./impl.js"
import { Choice } from "../graph/index.js"
import { ChoiceHandlerRegistration } from "./events.js"
import { Choice as CodeBlockChoice } from "../codeblock/CodeBlockProps.js"

export { expand, updateContent } from "./groups/expansion.js"

/** Key type for ChoicesMap */
export type Key = CodeBlockChoice["group"]

/* map from choice group to selected choice member */
export type ChoicesMap = Record<Key, CodeBlockChoice["title"]>

export interface ChoiceState {
  clone: () => ChoiceState
  onChoice: ChoiceHandlerRegistration
  offChoice: ChoiceHandlerRegistration

  /** State representing form completion */
  formComplete(choice: Choice, value: Record<string, string>): boolean

  /** Extract form responses */
  form(choice: Choice): Record<string, string>

  keys: () => ReturnType<typeof Object.keys>
  entries: () => ReturnType<typeof Object.entries>
  contains: (choice: Choice) => boolean
  get: (choice: Choice) => ChoicesMap[Key]
  set: (choice: Choice, value: ChoicesMap[Key], overrideRejections?: boolean) => boolean
  remove: (choice: Choice) => boolean
}

export type Choices = {
  choices: ChoiceState
}

export function newChoiceState(assertions: ChoicesMap = {}): ChoiceState {
  return new ChoiceStateImpl(assertions)
}
