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

import { ChoiceState } from "."
import { EventEmitter } from "events"

type Choices = { choices: ChoiceState }
type ChoiceHandler = (choices: Choices) => void
export type ChoiceHandlerRegistration = (handler: (choices: Choices) => void) => void

export default class ChoiceEventsManager extends EventEmitter {
  protected notifyOfChoice(choices: ChoiceState) {
    this.emit("/choice/update", { choices })
  }

  public onChoice(handler: ChoiceHandler) {
    this.on("/choice/update", handler)
  }

  public offChoice(handler: ChoiceHandler) {
    this.off("/choice/update", handler)
  }
}
