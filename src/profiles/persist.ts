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

import Debug from "debug"
import { join } from "path"

import { profilesPath } from "./paths.js"
import { MadWizardOptions } from "../fe/index.js"
import { ChoiceState, emptyChoiceState } from "../choices/index.js"

/** We can't seem to control any aspect of the temporary file names used by `write-file-atomic` :( */
export function isTemporary(profile: string) {
  return /\.\d+/.test(profile)
}

export async function save(choices: ChoiceState, options: MadWizardOptions = {}, profileName = choices.profile.name) {
  const writeFile = await import("write-file-atomic").then((_) => _.default)
  const filepath = join(await profilesPath(options, true), profileName)

  try {
    await writeFile(filepath, choices.serialize())
    Debug("madwizard/profile")("profile saved to " + filepath)
  } catch (err) {
    Debug("madwizard/profile")("error saving profile to " + filepath, err)
    throw err
  }
}

/**
 * Persist the set of `choices`, unioned with the previously restored suggestions.
 */
export default async function persist(
  options: MadWizardOptions,
  choices: ChoiceState,
  suggestions: ChoiceState = emptyChoiceState(),
  altProfileName?: string
) {
  const profileName = altProfileName || choices.profile.name

  // Careful of the order: we want to overlay new choices on top of
  // previous suggestions
  const union = suggestions.clone(profileName)
  choices.entries().forEach(([key, value]) => {
    union.setKey(key, value)
  })

  // make sure we use unify the lastUsedTime, too
  union.profile.lastUsedTime = Math.max(union.profile.lastUsedTime || 0, choices.profile.lastUsedTime || 0)

  await save(union, options, profileName)
}
