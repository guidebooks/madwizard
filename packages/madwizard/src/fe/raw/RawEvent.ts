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

import { Prompt } from "../Prompts.js"
import { ValidAnswer } from "../tree/ui.js"

export { ValidAnswer }

export type RawAskEvent = {
  type: "ask"
  ask: Prompt
  onChoose(value: ValidAnswer): void
  onCancel(): void
}

export type RawQADoneEvent = {
  type: "qa-done"
}

export type RawAllDoneEvent = {
  type: "all-done"
  success: boolean
}

export type RawEvent = RawAskEvent | RawQADoneEvent | RawAllDoneEvent
