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
import { ChoiceState, deserialize, newChoiceState } from "../choices/index.js"

/** Restore the named `profile` */
export default async function restore(options: MadWizardOptions, profile: string): Promise<ChoiceState> {
  const readFile = await import("fs").then((_) => _.readFile)
  const filepath = join(await profilesPath(options), profile)

  return new Promise((resolve, reject) => {
    readFile(filepath, (err, data) => {
      if (err) {
        if (err.code == "ENOENT") {
          Debug("madwizard/profile")("using fresh profile")
          resolve(newChoiceState(profile))
        } else {
          Debug("madwizard/profile")("error restoring profile from " + filepath, err)
          reject(err)
        }
      } else {
        Debug("madwizard/profile")("profile restored from " + filepath)
        try {
          resolve(deserialize(data.toString(), profile))
        } catch (err) {
          Debug("madwizard/profile")("error parsing profile from " + filepath, err)
          reject(err)
        }
      }
    })
  })
}
