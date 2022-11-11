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

import type Enquirer from "./enquirer"

export type Select = Enquirer.Select
export type MultiSelect = Enquirer.MultiSelect
export type Form = Enquirer.Form

export type Prompt = Select | MultiSelect | Form

export function isSelect(prompt: Prompt): prompt is Select {
  return prompt.type === "select"
}

export function isMultiSelect(prompt: Prompt): prompt is MultiSelect {
  return prompt.type === "multiselect"
}

export function isForm(prompt: Prompt): prompt is Form {
  return prompt.type === "form"
}
