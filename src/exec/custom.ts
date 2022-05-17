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
import { basename } from "path"
import { dir as tmpDir, file as tmpFile } from "tmp"

import shellItOut from "./shell"
import { ExecOptions } from "./options"
import { CustomExecutable } from "../codeblock"

/**
 * Shell out the execution of the given `cmdline` using the custom
 * `exec`. The protocol is that madwizard will set three environment
 * variables: `$MWDIR`, `$MWFILEPATH` and `$MWFILENAME`. It will copy
 * the code block source into a new directory (`$MWDIR`), give that
 * code block file a file name (`$MWFILENAME`), and then invoke the
 * given `exec` attribute of the code block with those environment
 * variables defined.
 *
 * For example:
 * ```python
 * ---
 * exec: mycustompython "$MWFILEPATH"
 * ---
 * someFancyPythonCode()
 * ```
 *
 */
export default async function execAsCustom(
  cmdline: string | boolean,
  opts: ExecOptions,
  exec: CustomExecutable["exec"]
): Promise<"success"> {
  return new Promise<"success">((resolve, reject) => {
    tmpDir((err, dir, cleanupCallback1) => {
      if (err) {
        reject(err)
      } else {
        tmpFile({ dir }, (err, filepath, fd, cleanupCallback2) => {
          // TODO use cleanupCallback
          write(fd, cmdline.toString(), (err) => {
            if (err) {
              reject(err)
            } else {
              console.error("!!!!!", exec)
              shellItOut(exec, opts, { MWDIR: dir, MWFILEPATH: filepath, MWFILENAME: basename(filepath) })
                .then(resolve, reject)
                .finally(() => {
                  cleanupCallback2()
                  cleanupCallback1()
                })
            }
          })
        })
      }
    })
  })
}
