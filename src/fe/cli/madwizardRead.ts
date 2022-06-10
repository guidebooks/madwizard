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
import { isAbsolute, join } from "path"

import fetch from "make-fetch-happen"
import { read as vfileRead } from "to-vfile"

import { cachePath } from "../../util/cache.js"
import { toRawGithubUserContent } from "../../parser/markdown/snippets/urls.js"

export async function get(uri: string) {
  return fetch(uri, { cachePath: cachePath() })
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
      if (searchStore && store && !isAbsolute(file.path) && !/\.md$/.test(file.path)) {
        const withSlashIndexDotMd = new VFile(file)
        const withDotMd = new VFile(file)
        withSlashIndexDotMd.path = join(store, file.path, "index.md")
        withDotMd.path = join(store, file.path + ".md")

        try {
          // try ml/ray/run/index.md and ml/ray/run.md, and return
          // whichever first succeeds
          return await Promise.any([withSlashIndexDotMd, withDotMd].map((_) => vfileRead(_)))
        } catch (err) {
          Debug("madwizard/read")(err)
          // fallthrough
        }
      }

      // normal file read, without any store/ prefixing
      return await vfileRead(file)
    } catch (err) {
      if (err.code === "EISDIR" || (err.code === "ENOENT" && !/\.md/.test(file.path))) {
        try {
          const nFile = new VFile(file)
          nFile.path = err.code === "EISDIR" ? join(file.path, "index.md") : file.path + ".md"
          return await vfileRead(nFile)
        } catch (err2) {
          try {
            const nFile = new VFile(file)
            nFile.path = file.path + ".md"
            return await vfileRead(nFile)
          } catch (err3) {
            if (!searchStore) {
              throw err
            }
          }
        }
      } else if (!searchStore || /^\//.test(file.path)) {
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
