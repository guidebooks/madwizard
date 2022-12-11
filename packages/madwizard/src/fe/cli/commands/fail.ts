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

import { Argv } from "yargs"

import Opts from "../options.js"

/** Create a `yargs` fail function */
export default function fail(
  yargs: Argv<Opts>,
  resolve: (ret: unknown) => void,
  reject: (err: Error) => void,
  argv: string[]
) {
  return async function fail(msg: string, err: Error) {
    if (!err && /Unknown argument:/.test(msg)) {
      // failsafe: assume they are running a guide
      try {
        await yargs.parseAsync(["guide", ...argv]).then(resolve)
        return
      } catch (err) {
        // intentional fallthrough
      }

      // intentional fallthrough
    }

    yargs.showHelp()
    reject(err)
  }
}
