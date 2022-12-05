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

import { dataPath } from "../../util/cache.js"
import { MadWizardOptions } from "../MadWizardOptions.js"
import defaultProfileName from "../../profiles/defaultName.js"

const defaults: MadWizardOptions = {
  /**
   * The default path for guidebooks to store data is determined by
   * `dataPath()`, which uses platform-specific logic.
   */
  dataPath: dataPath(),

  interactive: true,

  /** The choice profile to use */
  profile: defaultProfileName,

  /**
   * Hysteresis, in milliseconds, for batching the persistence (to
   * disk) of choice updates. This can avoid a flurry of file I/O, but
   * means process crashes or ctrl+c's may result in unsaved choices.
   */
  profileSaveDelay: 50,

  /**
   * [Advanced] Yes, we want to kill any subprocesses guidebooks might
   * have launched (via `shell.async`).
   */
  clean: true,

  /** In raw mode, any raw models emitted to the stdout will be prefixed with this string [default: "MADWIZARD_RAW"] */
  rawPrefix: "MADWIZARD_RAW",
}

export default defaults
