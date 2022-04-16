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

import ChoiceState, { ChoicesMap } from "."
import { notifyOfChoice } from "./events"

export default class ChoiceStateImpl implements ChoiceState {
  /** Choices made, e.g. "i want to install using homebrew" */
  private readonly _choices: ChoicesMap = {}

  /** Choices rejected, e.g. "i really don't want to install using curl" */
  private readonly rejectedChoices: Record<keyof ChoicesMap, boolean> = {}

  public keys() {
    return Object.keys(this._choices)
  }

  public entries() {
    return Object.entries(this._choices)
  }

  public contains(key: keyof ChoicesMap) {
    return key in this._choices
  }

  public get(key: keyof ChoicesMap) {
    return this._choices[key]
  }

  public remove<K extends keyof ChoicesMap>(key: K) {
    if (key in this._choices) {
      delete this._choices[key]
      this.rejectedChoices[key] = true
      notifyOfChoice(this)
      return true
    } else {
      return false
    }
  }

  public set<K extends keyof ChoicesMap>(key: K, value: ChoicesMap[K], overrideRejections = true) {
    if (this._choices[key] === value) {
      return false
    }

    if (overrideRejections || !(key in this.rejectedChoices)) {
      delete this.rejectedChoices[key]
      this._choices[key] = value
      notifyOfChoice(this)
      return true
    } else {
      return false
    }
  }
}
