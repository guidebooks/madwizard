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

import envPaths from "env-paths"
import fetch from "make-fetch-happen"

import { VFile } from "vfile"
import { read as vfileRead } from "to-vfile"

import { toRawGithubUserContent } from "./snippets/urls"

export function get(uri: string) {
  return fetch(uri, { cachePath: envPaths("madwizard").cache })
}

/** Fetch the contents of the given `VFile` */
export async function madwizardRead(file: VFile, searchStore = false): Promise<VFile> {
  if (/^https?:/.test(file.path)) {
    // remote fetch
    const res = await get(file.path)
    file.value = (await res.buffer()).toString()
    if (res.status !== 200) {
      throw new Error(file.value)
    } else {
      return file
    }
  } else {
    try {
      // try reading from the local filesystem
      return await vfileRead(file)
    } catch (err) {
      if (!searchStore) {
        throw err
      }

      // see if the path is in the guidebooks store
      const ext = /\..+$/.test(file.path) ? "" : "md"
      const base = `https://github.com/guidebooks/store/blob/main/guidebooks/${file.path}`

      try {
        const path = toRawGithubUserContent(`${base}.${ext}`)
        return await madwizardRead(new VFile({ path }))
      } catch (err2) {
        try {
          const path = toRawGithubUserContent(`${base}/index.${ext}`)
          return await madwizardRead(new VFile({ path }))
        } catch (err3) {
          throw err
        }
      }
    }
  }
}
