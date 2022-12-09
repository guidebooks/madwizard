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

import { Writable } from "stream"
import { Arguments, CommandModule } from "yargs"

import { MadWizardOptions } from "../../MadWizardOptions.js"

import Opts, { assembleOptions } from "../options.js"
import { InputOpts, inputBuilder } from "./input.js"
import { getBlocksModel, loadAssertions } from "./util.js"

async function planHandler<Writer extends Writable["write"]>(
  providedOptions: MadWizardOptions,
  argv: Arguments<InputOpts>,
  write?: Writer
) {
  const { newChoiceState } = await import("../../../choices/index.js")
  const options = assembleOptions(providedOptions, argv)
  const choices = loadAssertions(
    newChoiceState(argv.profile === false ? "ignore" : argv.profile),
    providedOptions,
    argv
  )
  const blocks = await getBlocksModel(argv.input, choices, options)
  await import("../../tree/index.js").then((_) =>
    _.prettyPrintUITreeFromBlocks(blocks, choices, Object.assign({ write }, options))
  )
}

export default function planModule<Writer extends Writable["write"]>(
  resolve: (value: unknown) => void,
  reject: (err: Error) => void,
  providedOptions: MadWizardOptions,
  write: Writer
): CommandModule<Opts, InputOpts> {
  return {
    command: "plan <input>",
    describe: "Parse a given markdown and pretty print the execution plan",
    builder: inputBuilder,
    handler: async (argv) => planHandler(providedOptions, argv, write).then(resolve, reject),
  }
}
