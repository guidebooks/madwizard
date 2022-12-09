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
import { getBlocksModel, loadAssertions, loadSuggestions, makeMemos } from "./util.js"

async function jsonHandler<Writer extends Writable["write"]>(
  providedOptions: MadWizardOptions,
  argv: Arguments<InputOpts>,
  write?: Writer
) {
  const [{ EOL }, { newChoiceState }, { compile }] = await Promise.all([
    import("os"),
    import("../../../choices/index.js"),
    import("../../../graph/index.js"),
  ])

  const options = assembleOptions(providedOptions, argv)
  const suggestions = await loadSuggestions(argv, options)
  const choices = loadAssertions(newChoiceState(options.profile), providedOptions, argv)
  const memos = await makeMemos(suggestions, argv)
  const blocks = await getBlocksModel(argv.input, choices, options)
  const graph = await compile(blocks, choices, memos, options)
  const wizard = await import("../../../wizard/index.js").then((_) => _.wizardify(graph, memos))
  ;(write || process.stdout.write.bind(process.stdout))(
    JSON.stringify(
      wizard,
      (key, value) => {
        if (key === "source" || key === "position") {
          return "placeholder"
        } else if (key === "key" || key === "id") {
          return "somekey"
        } else if (key === "description" && !value) {
          return undefined
        } else if (key === "nesting" && Array.isArray(value)) {
          return undefined
        } else if (key === "barrier" && value === false) {
          return undefined
        } else if (key === "status" && value === "blank") {
          return undefined
        } else {
          return value
        }
      },
      2
    ) + EOL
  )
}

export default function jsonModule<Writer extends Writable["write"]>(
  resolve: (value: unknown) => void,
  reject: (err: Error) => void,
  providedOptions: MadWizardOptions,
  write: Writer
): CommandModule<Opts, InputOpts> {
  return {
    command: "json <input>",
    describe: "Parse a given markdown and print the raw execution plan model as JSON",
    builder: inputBuilder,
    handler: (argv) => jsonHandler(providedOptions, argv, write).then(resolve, reject),
  }
}
