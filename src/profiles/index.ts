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
import { ChoicesMap } from "../choices/index.js"
import { MadWizardOptions } from "../fe/index.js"

export * from "./paths.js"
export { default as clone } from "./clone.js"
export { default as list } from "./list.js"
export { default as persist } from "./persist.js"
export { default as restore } from "./restore.js"

export interface Profile {
  /** Name of this profile */
  name: string

  /** Timestamp at which this profile was created */
  creationTime: number

  /** Timestamp at which this profile was last modified */
  lastModifiedTime: number

  /** (future-proofing, not currently used) User-defined tags associated with this profile */
  tags?: string[]

  /** The choices made by this profile */
  choices: ChoicesMap
}

export function isProfile(obj: unknown): obj is Profile {
  const profile = obj as Profile
  return (
    typeof profile === "object" &&
    typeof profile.creationTime === "number" &&
    typeof profile.lastModifiedTime === "number" &&
    typeof profile.name === "string" &&
    typeof profile.choices === "object"
  )
}

/** @return an in-memory copy of the given `Profile`, but one using the new `name` */
export function copyWithName(profile: Profile, name: string) {
  return Object.assign({}, profile, { name })
}

/** Perform a disk-to-disk copy of the given named `profile` to the given `distFielpath` */
export async function copyChoices(dstFilepath: string, options: MadWizardOptions, profile = "default") {
  const copyFile = await import("fs").then((_) => _.copyFile)
  const srcFilepath = join(await profilesPath(options, true), profile)

  return new Promise<void>((resolve, reject) => {
    copyFile(srcFilepath, dstFilepath, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
