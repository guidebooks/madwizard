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
import { Writable } from "stream"

import { UI } from "../../tree/index.js"
import { MadWizardOptions } from "../../MadWizardOptions.js"

import Opts from "../options.js"
import { GuideRet, guideHandler } from "./guide.js"

/** Create a `yargs` fail function */
export default function fail<Writer extends Writable["write"]>(
  resolve: (ret: GuideRet) => void,
  reject: (err: Error) => void,
  providedOptions: MadWizardOptions,
  argv: string[],
  write?: Writer,
  ui?: UI<string>
) {
  return function fail(msg: string, err: Error, yargs: Argv<Opts>) {
    if (!err && /Unknown argument/.test(msg)) {
      // failsafe: assume they are running a guide
      guideHandler("guide", providedOptions, { input: argv[1], _: argv, $0: "madwizard" }, write, ui).then(
        resolve,
        reject
      )
    } else {
      yargs.showHelp()
      reject(err)
    }
  }
}
