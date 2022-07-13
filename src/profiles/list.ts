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

import restore from "./restore.js"
import { profilesPath } from "./paths.js"
import { MadWizardOptions } from "../fe/index.js"
import { ChoiceState } from "../choices/index.js"

/** List known profiles */
export default async function list(options: MadWizardOptions): Promise<ChoiceState[]> {
  const [readdir, filepath] = await Promise.all([import("fs").then((_) => _.readdir), profilesPath(options)])

  return new Promise((resolve, reject) => {
    readdir(filepath, (err, files) => {
      if (err) {
        reject(err)
      } else {
        resolve(
          Promise.all(
            files
              .filter((_) => !/\./.test(_)) // exclude write-file-atomic temporaries; see ./persist.js
              .filter((_) => !/~$/.test(_)) // exclude emacs temporaries
              .map((_) => restore(options, _))
          )
        )
      }
    })
  })
}
