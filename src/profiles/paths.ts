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

import { join } from "path"

import defaults from "../fe/cli/defaults.js"
import { MadWizardOptions } from "../fe/index.js"

/** Location for guidebooks to store non-profile-specific data */
export function guidebookGlobalDataPath(opts: MadWizardOptions) {
  return opts.dataPath || defaults.dataPath
}

/** Location for guidebooks to store profile-specific data */
export function guidebookProfileDataPath(opts: MadWizardOptions) {
  return join(guidebookGlobalDataPath(opts), opts.profile || defaults.profile)
}

/** @return the filepath in which persistent profiles are stored */
export async function profilesPath(options: MadWizardOptions, mkdir = false) {
  const filepath = join(
    options.profilesPath || process.env.MWPROFILES_PATH || guidebookGlobalDataPath(options),
    "profiles"
  )
  if (mkdir) {
    const mkdirp = await import("mkdirp").then((_) => _.default)
    await mkdirp(filepath)
  }
  return filepath
}
