/*
 * Copyright 2023 The Kubernetes Authors
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
import { ChoiceState } from "../../../../choices/index.js"

import { namedProfileBuilder } from "./builder.js"
import { MadWizardOptions } from "../../../MadWizardOptions.js"

export async function prune(choices: ChoiceState, options: MadWizardOptions) {
  const [{ exists }] = await Promise.all([import("../util.js")])

  const guidebookStillExists = await Promise.all(
    choices
      .keys()
      .filter((key) => !/madwizard/.test(key) && !/_/.test(key))
      .map(async (choice) => ({
        choice,
        exists: ((await exists(choice, options)) && true) || false,
      }))
  )

  let nRemoved = 0
  for (const { choice, exists } of guidebookStillExists) {
    if (!exists) {
      console.error(chalk.red("Deleting choice " + choice))
      choices.removeKey(choice)
      nRemoved++
    }
  }

  return nRemoved
}

async function pruneAndSave(choices: ChoiceState, options: MadWizardOptions) {
  const nRemoved = await prune(choices, options)

  if (nRemoved > 0) {
    console.error(chalk.green(`Removed ${nRemoved} obsolete entries from profile ${choices.profile.name}`))
    const { save } = await import("../../../../profiles/persist.js")
    await save(choices, options)
  } else {
    console.error(chalk.yellow(`Nothing to prune in profile ${choices.profile.name}`))
  }
}

/** madwizard profile prune <profile> */
export default function pruneProfile(providedOptions: MadWizardOptions) {
  return {
    command: "prune <profile>",
    describe: "Prune choices in a profile that are no longer covered by the latest guidebook store",
    builder: namedProfileBuilder,
    handler: async (argv) => {
      const [profile, { assembleOptions }] = await Promise.all([
        import("../../../../profiles/restore.js").then((_) => _.default(providedOptions, argv.profile)),
        import("../../options.js"),
      ])
      await pruneAndSave(profile, assembleOptions(providedOptions, argv))
    },
  }
}
