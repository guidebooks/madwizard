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

import { write } from "fs"
import { file as tmpFile } from "tmp"

import shellItOut from "./shell"
import { ExecOptions } from "./options"

/** Execute a python script in a subprocess */
export default function pythonItOut(cmdline: string | boolean, opts: ExecOptions) {
  return new Promise<"success">((resolve, reject) => {
    tmpFile({ postfix: ".py" }, (err, filepath, fd, cleanupCallback) => {
      if (err) {
        reject(err)
      } else {
        write(fd, cmdline.toString(), (err) => {
          if (err) {
            reject(err)
          } else {
            shellItOut(`python3 -u "${filepath}"`, opts).then(resolve, reject).finally(cleanupCallback)
          }
        })
      }
    })
  })
}