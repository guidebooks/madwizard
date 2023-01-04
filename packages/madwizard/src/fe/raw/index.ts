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

import { RawEvent } from "./RawEvent.js"
import { MadWizardOptions } from "../MadWizardOptions.js"

export { RawEvent }

type CLI = string
type Handler = (evt: RawEvent) => void
export type RawImpl = CLI | Handler

type RawMode<R extends RawImpl> = Required<Pick<MadWizardOptions<R>, "raw">>
export type WithRawViaCLI = RawMode<CLI>
export type WithRawViaHandler = RawMode<Handler>

function isRawViaCLI(options: MadWizardOptions): options is WithRawViaCLI {
  return typeof (options as WithRawViaCLI).raw === "string"
}

export function isRawViaHandler(options: MadWizardOptions): options is WithRawViaHandler {
  return typeof (options as WithRawViaHandler).raw === "function"
}

export default function isRaw(options: MadWizardOptions): options is WithRawViaHandler | WithRawViaCLI {
  return isRawViaCLI(options) || isRawViaHandler(options)
}
