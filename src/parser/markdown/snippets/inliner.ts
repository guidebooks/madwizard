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

import { writeFile } from "fs"
import { dirname, join } from "path"

import inlineSnippets from "./index.js"
import { fetcherFor } from "../fetch.js"
import { madwizardRead } from "../../../fe/cli/madwizardRead.js"

/**
 * Fetch and inline all content in the given
 * `${srcDir}/${srcRelPath}`, and emit to `${targetDir}/${srcRelPath}`
 *
 * @param {String} srcDir Directory enclosing source content
 * @param {String} srcRelPath Path inside of srcDir to process
 * @param {String} targetDir Enclosing directory for generated content
 */
export async function inliner(srcDir: string, srcRelPath: string, targetDir: string) {
  const srcFilePath = join(srcDir, srcRelPath)
  const fetcher = fetcherFor(madwizardRead)
  const data = await fetcher(srcFilePath)
  const inlined = await inlineSnippets({ fetcher })(data, srcFilePath)

  const mkdirp = (await import("mkdirp")).default
  const targetPath = join(targetDir, srcRelPath)
  await mkdirp(dirname(targetPath))
  await new Promise<void>((resolve, reject) => {
    writeFile(targetPath, inlined, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
