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

import chalk from "chalk"
import { Writable } from "stream"
import { Arguments, CommandModule } from "yargs"

import { UI } from "../../../tree/index.js"
import { MadWizardOptions } from "../../../MadWizardOptions.js"

import Opts from "../../options.js"

import builder from "./builder.js"
import GuideOpts from "./options.js"
import handler, { GuideRet } from "./handler.js"

export default function guideModule<Writer extends Writable["write"]>(
  task: "run" | "guide",
  resolve: (ret: GuideRet) => void,
  reject: (err: Error) => void,
  providedOptions: MadWizardOptions,
  write?: Writer,
  ui?: UI<string>,
  describe: CommandModule["describe"] = "View an interactive " + chalk.cyan("wizard") + " for a markdown file"
): CommandModule<Opts, GuideOpts> {
  return {
    command: `${task} <input>`,
    describe,
    builder,
    handler: async (argv: Arguments<GuideOpts>) =>
      await handler(task, providedOptions, argv, write, ui).then(resolve, reject),
  }
}
