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
import envPaths from "env-paths"

import { MadWizardOptions } from "../fe/index.js"
import { ChoiceState, deserialize, newChoiceState } from "../choices/index.js"

/** @return the filepath in which all persistent caches are stored */
export function cachePath() {
  return envPaths("madwizard").cache
}

/** @return the filepath in which all persistent data are stored */
export function dataPath() {
  return envPaths("madwizard").data
}

/** @return the filepath in which persistent profiles are stored */
async function profilesPath(options: MadWizardOptions, mkdir = false) {
  const filepath = join(options.profilesPath || process.env.MWPROFILES_PATH || dataPath(), "profiles")
  if (mkdir) {
    const mkdirp = await import("mkdirp").then((_) => _.default)
    await mkdirp(filepath)
  }
  return filepath
}

/** Persist the set of `choices`, unioned with the previously restored suggestions, as a profile named by `profile` */
export async function persistChoices(
  options: MadWizardOptions,
  choices: ChoiceState,
  suggestions: ChoiceState,
  profile = "default"
) {
  const writeFile = await import("fs").then((_) => _.writeFile)
  const filepath = join(await profilesPath(options, true), profile)

  // Careful of the order: we want to overlay new choices on top of
  // previous suggestions
  const union = suggestions.clone()
  choices.entries().forEach(([key, value]) => {
    union.setKey(key, value)
  })

  return new Promise<void>((resolve, reject) => {
    writeFile(filepath, union.serialize(), (err) => {
      if (err) {
        Debug("madwizard/profile")("error saving profile to " + filepath, err)
        reject(err)
      } else {
        Debug("madwizard/profile")("profile saved to " + filepath)
        resolve()
      }
    })
  })
}

export async function restoreChoices(options: MadWizardOptions, profile = "default"): Promise<ChoiceState> {
  const readFile = await import("fs").then((_) => _.readFile)
  const filepath = join(await profilesPath(options), profile)

  return new Promise((resolve, reject) => {
    readFile(filepath, (err, data) => {
      if (err) {
        if (err.code == "ENOENT") {
          Debug("madwizard/profile")("using fresh profile")
          resolve(newChoiceState())
        } else {
          Debug("madwizard/profile")("error restoring profile from " + filepath, err)
          reject(err)
        }
      } else {
        Debug("madwizard/profile")("profile restored from " + filepath)
        try {
          resolve(deserialize(data.toString()))
        } catch (err) {
          Debug("madwizard/profile")("error parsing profile from " + filepath, err)
          reject(err)
        }
      }
    })
  })
}
