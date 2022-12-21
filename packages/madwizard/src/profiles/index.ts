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
import defaultProfileName from "./defaultName.js"
import { MadWizardOptions } from "../fe/index.js"

export * from "./paths.js"

export { default as list } from "./list.js"
export { default as touch } from "./touch.js"
export { default as clone } from "./clone.js"
export { default as rename } from "./rename.js"
export { default as remove } from "./delete.js"
export { default as restore } from "./restore.js"
export { default as reset } from "./reset.js"
export { save, isTemporary, default as persist } from "./persist.js"

/**
 * Search for the named profile. If found, bump it's lastUsedTime
 * attribute to be now, persist the change, and return true. If not
 * found, return false.
 */
export async function bumpLastUsedTime(profileName: string, options: MadWizardOptions = {}) {
  const [list, save] = await Promise.all([
    import("./list.js").then((_) => _.default),
    import("./persist.js").then((_) => _.save),
  ])
  const profiles = await list(options)
  const profile = profiles.find((_) => _.profile.name === profileName)
  if (profile) {
    profile.profile.lastUsedTime = Date.now()
    await save(profile, options)
    return true
  } else {
    return false
  }
}

export async function lastUsed(options: MadWizardOptions = {}) {
  return import("./list.js")
    .then((_) => _.default(options))
    .then((L) => L.sort((a, b) => b.profile.lastUsedTime - a.profile.lastUsedTime))
    .then((L) => (L[0] ? L[0].profile.name : undefined))
}

/** Create a new empty profile if the user has none */
export async function createIfNeeded(options: MadWizardOptions = {}) {
  const last = await lastUsed(options)
  if (!last) {
    const [persist, emptyChoiceState] = await Promise.all([
      import("./persist.js").then((_) => _.default),
      import("../choices/index.js").then((_) => _.emptyChoiceState),
    ])
    await persist(options, emptyChoiceState(defaultProfileName))
  }
}

/** Perform a disk-to-disk copy of the given named `profile` to the given `distFielpath` */
export async function copyChoices(
  dstFilepath: string,
  options: MadWizardOptions,
  profile = options.profile || defaultProfileName
) {
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
