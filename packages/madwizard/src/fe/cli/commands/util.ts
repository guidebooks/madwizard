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

import { Arguments } from "yargs"

import { ChoiceState } from "../../../choices/index.js"
import { MadWizardOptions, MadWizardOptionsWithInput } from "../../MadWizardOptions.js"

import Opts from "../options.js"

/** @return a new Memoizer */
export async function makeMemos(suggestions: ChoiceState, argv: Arguments<Opts>) {
  const Memoizer = await import("../../../memoization/index.js").then((_) => _.Memoizer)
  const memos = new Memoizer(suggestions)

  // allow guidebooks to selectively inject -- <rest> arguments into shell commands
  memos.env.GUIDEBOOK_DASHDASH = argv["--"] ? argv["--"].join(" ") : ""

  return memos
}

export async function loadSuggestions(argv: Arguments<Opts>, options: MadWizardOptions): Promise<ChoiceState> {
  return argv.profile === false
    ? import("../../../choices/index.js").then((_) => _.newChoiceState("ignore"))
    : import("../../../profiles/restore.js").then((_) => _.default(options, options.profile))
}

export function loadAssertions(
  choices: ChoiceState,
  providedOptions: MadWizardOptions,
  argv: Arguments<Opts>
): ChoiceState {
  // assert a choice to have a given value, from programmatic options
  if (providedOptions && typeof providedOptions.assertions === "object") {
    Object.entries(providedOptions.assertions).forEach(([key, value]) => {
      choices.setKey(key, value)
    })
  }

  // assert a choice to have a given value, from command line
  if (argv.assert) {
    const assertions = Array.isArray(argv.assert) ? argv.assert : [argv.assert]
    assertions
      .map((_) => _.split(/=/))
      .forEach(([key, value]) => {
        choices.setKey(key, value)
      })
  }

  return choices
}

/** @return the block model, either by using a precompiled model from the store, or by parsing the source */
export async function getBlocksModel(input: string, choices: ChoiceState, options: MadWizardOptionsWithInput) {
  // check to see if the compiled model exists
  if (input !== "-") {
    const [{ access, readFile }, { targetPathForAst }] = await Promise.all([
      import("fs/promises"),
      import("../../../parser/markdown/snippets/mirror-paths.js"),
    ])

    const ast1 = targetPathForAst(input + "/index.md", options.store)
    const ast2 = targetPathForAst(input + ".md", options.store)
    const mightBeAst = !/\.md$/.test(input) && !/^http/.test(options.store)
    const [exists1, exists2] = await Promise.all([
      !mightBeAst
        ? ""
        : access(ast1)
            .then(() => ast1)
            .catch(() => ""),
      !mightBeAst
        ? ""
        : access(ast2)
            .then(() => ast2)
            .catch(() => ""),
    ])
    if (exists1 || exists2) {
      // yes! the pre-parsed ast model exists
      const { populateAprioris } = await import("../../../choices/groups/index.js")
      await populateAprioris(choices, options)
      return JSON.parse(await readFile(exists1 || exists2).then((_) => _.toString()))
    } // intentionally fall-through
  }

  // if we get here, then we need to parse it from the source (much slower)
  const [{ madwizardRead }, { parse }] = await Promise.all([
    import("../madwizardRead.js"),
    import("../../../parser/index.js"),
  ])
  await import("debug").then((_) => _.default("madwizard/fe/cli")("using guidebook " + input))
  return parse(input, madwizardRead, choices, undefined, options).then((_) => _.blocks)
}
