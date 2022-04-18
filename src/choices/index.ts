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

import ChoiceStateImpl from "./impl"
import { Choice as CodeBlockChoice } from "../codeblock/CodeBlockProps"
import { ChoiceHandlerRegistration } from "./events"

/* map from choice group to selected choice member */
export type ChoicesMap = Record<CodeBlockChoice["group"], CodeBlockChoice["title"]>

export interface ChoiceState {
  clone: () => ChoiceState
  onChoice: ChoiceHandlerRegistration
  offChoice: ChoiceHandlerRegistration

  keys: () => ReturnType<typeof Object.keys>
  entries: () => ReturnType<typeof Object.entries>
  contains: <K extends keyof ChoicesMap>(key: K) => boolean
  get: <K extends keyof ChoicesMap>(key: K) => ChoicesMap[K]
  set: <K extends keyof ChoicesMap>(key: K, value: ChoicesMap[K], overrideRejections?: boolean) => boolean
  remove: <K extends keyof ChoicesMap>(key: K) => boolean
}

export type Choices = {
  choices: ChoiceState
}

export function newChoiceState(): ChoiceState {
  return new ChoiceStateImpl()
}
