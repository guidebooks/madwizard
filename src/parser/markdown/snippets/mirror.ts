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

import { readdir } from "fs"
import { oraPromise } from "ora"
import { writeFile } from "fs/promises"
import { basename, dirname, join } from "path"

import { inliner } from "./inliner.js"
import { MadWizardOptions } from "../../../fe/index.js"

import { parse } from "../../../parser/index.js"
import { newChoiceState } from "../../../choices/index.js"
import { madwizardRead } from "../../../fe/cli/madwizardRead.js"

/**
 * We pre-parse the source into the `blocks` model (our AST). This
 * returns the location of the ast model associated with the given source `filepath`.
 */
export function targetPathForAst(filepath: string, storePrefix = "") {
  return join(storePrefix, dirname(filepath), basename(filepath, ".md") + "-madwizard.json")
}

export async function mirror(srcDir: string, targetDir: string, srcRelPath = "", options: MadWizardOptions) {
  // Debug.enable("madwizard/fetch/snippets")

  const srcFilePath = join(srcDir, srcRelPath)
  await new Promise<void>((resolve, reject) => {
    readdir(srcFilePath, { withFileTypes: true }, async (err, files) => {
      if (err) {
        reject(err)
      } else {
        await Promise.all(
          files.map(async (entry) => {
            const relpath = join(srcRelPath, entry.name)

            if (entry.isFile() && /\.md$/.test(entry.name)) {
              await oraPromise(
                inliner(srcDir, relpath, targetDir, Object.assign({}, options, { store: srcDir })),
                `Inlining ${relpath}`
              )

              await oraPromise(async () => {
                const targetPathForInlinedContent = join(targetDir, relpath) // dst/foo.md
                const pathForAst = targetPathForAst(targetPathForInlinedContent) // dst/foo-madwizard.json

                const nonProfile = "not-a-profile"

                const { blocks } = await parse(
                  targetPathForInlinedContent,
                  madwizardRead,
                  newChoiceState(nonProfile),
                  undefined,
                  {}
                )
                await writeFile(
                  pathForAst,
                  JSON.stringify(blocks, (key, value) => {
                    if (
                      key === "child" ||
                      key === "containedCodeBlocks" ||
                      key === "source" ||
                      key === "position" ||
                      (key === "level" && typeof value === "number")
                    ) {
                      return undefined
                    } else {
                      return value
                    }
                  })
                )
              }, `Optimizing ${relpath}`)
            } else if (entry.isDirectory()) {
              await mirror(srcDir, targetDir, relpath, options)
            }
          })
        )

        resolve()
      }
    })
  })
}
