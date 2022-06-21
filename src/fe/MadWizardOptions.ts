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

import { CompilerOptions } from "../graph/compile"

export interface RunOptions {
  /** Don't actually execute anything, but making choices and
   * validation and expanding lists is ok
   */
  dryRun: boolean

  /** Name of profile to use */
  profile: string

  /** Profile flush hysteresis. To avoid a flood of file writes, you can control the hystersis delay for profile persistence [default: 50ms] */
  profileSaveDelay: number
}

export interface DisplayOptions {
  /** Shorten output of long or multi-line code blocks. */
  narrow: boolean

  /** Verbose output */
  verbose: boolean

  /** Clear the screen when running in guide mode [default: true] */
  clear: boolean
}

interface FetchOptions {
  /** Base URI of Guidebook store? */
  store: string

  /**
   * Path to an mkdocs.yml config. This may be used to assist in
   * finding snippet content when parsing markdown.
   */
  mkdocs: string

  /** Location of persisted profiles (remembered choices from prior runs) */
  profilesPath: string
}

export type MadWizardOptions = Partial<CompilerOptions> &
  Partial<DisplayOptions> &
  Partial<FetchOptions> &
  Partial<RunOptions>
