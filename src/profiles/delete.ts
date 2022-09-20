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
import { profilesPath } from "./paths.js"
import { MadWizardOptions } from "../fe/index.js"

/** Delete a profile */
export default async function deleteProfile(options: MadWizardOptions, profileName: string): Promise<void> {
  const filepath = join(await profilesPath(options, true), profileName)
  const { unlink } = await import("fs")

  return new Promise<void>((resolve, reject) => {
    unlink(filepath, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
