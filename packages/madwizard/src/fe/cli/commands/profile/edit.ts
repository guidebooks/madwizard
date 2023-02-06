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

import { prune } from "./prune.js"
import { Profile } from "../../../../profiles/Profile.js"

import { namedProfileBuilder } from "./builder.js"
import { MadWizardOptions } from "../../../MadWizardOptions.js"

async function selectChoiceToEdit(profile: Profile) {
  const Select = await import("enquirer").then((_) => _.Select)
  const prompt = new Select({
    message: "Select a choice to edit",
    choices: Object.keys(profile.choices)
      .filter((key) => !/madwizard/.test(key) && !/_/.test(key))
      .sort()
      .map((name) => ({ name })),
  })
  return prompt.run()
}

async function editChoice(choice: string, profile: Profile, providedOptions: MadWizardOptions) {
  const guide = await import("../guide/handler.js").then((_) => _.default)
  await guide("guide", providedOptions, { input: choice, profile: profile.name, _: [], $0: "" })
}

/** madwizard profile edit <profile> */
export default function editProfile(providedOptions: MadWizardOptions) {
  return {
    command: "edit <profile>",
    describe: "Edit the choices of a profile",
    builder: namedProfileBuilder,
    handler: async (argv) => {
      const [choices, { assembleOptions }] = await Promise.all([
        import("../../../../profiles/restore.js").then((_) => _.default(providedOptions, argv.profile)),
        import("../../options.js"),
      ])

      await prune(choices, assembleOptions(providedOptions, argv), false) // false: not verbose
      const choiceToEdit = await selectChoiceToEdit(choices.profile)
      await editChoice(choiceToEdit, choices.profile, providedOptions)
    },
  }
}
