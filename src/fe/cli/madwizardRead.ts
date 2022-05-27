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
import { VFile } from "vfile"
import envPaths from "env-paths"

import fetch from "make-fetch-happen"
import { read as vfileRead } from "to-vfile"

import { join } from "../../parser/markdown/snippets/index.js"
import { toRawGithubUserContent } from "../../parser/markdown/snippets/urls.js"

export async function get(uri: string) {
  return fetch(uri, { cachePath: envPaths("madwizard").cache })
}

/** Fetch the contents of the given `VFile` */
export async function madwizardRead(
  file: VFile,
  store = "https://github.com/guidebooks/store/blob/main/guidebooks",
  searchStore = false
): Promise<VFile> {
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
      if (err.code === "EISDIR") {
        const nFile = new VFile(file)
        nFile.path = join(file.path, "index.md")
        return await madwizardRead(nFile, store, searchStore)
      } else if (!searchStore) {
        throw err
      }

      // see if the path is in the guidebooks store
      const ext = /\..+$/.test(file.path) ? "" : ".md"
      const base = join(store, file.path)

      try {
        const path = toRawGithubUserContent(`${base}${ext}`)
        const nFile = new VFile(file)
        nFile.path = path
        return await madwizardRead(nFile)
      } catch (err2) {
        Debug("madwizard/read")(err2)
        try {
          const path = toRawGithubUserContent(`${base}/index${ext}`)
          const nFile = new VFile(file)
          nFile.path = path
          return await madwizardRead(nFile)
        } catch (err3) {
          Debug("madwizard/read")(err3)
          throw err
        }
      }
    }
  }
}
