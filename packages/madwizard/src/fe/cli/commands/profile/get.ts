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

import { namedProfileBuilder } from "./builder.js"
import { MadWizardOptions } from "../../../MadWizardOptions.js"

/** madwizard profile get <profile> */
export default function getProfile(providedOptions: MadWizardOptions) {
  return {
    command: "get <profile>",
    describe: "Get the details of a profile",
    builder: namedProfileBuilder,
    handler: async (argv) => {
      const [ui, profile] = await Promise.all([
        import("../../../profiles/details.js").then((_) => _.default),
        import("../../../../profiles/get.js").then((_) => _.default(providedOptions, argv.profile)),
      ])
      console.log(await ui(profile))

      // TODO:
      // const chalk = await import('chalk').then(_ => _.default)
      // console.error("💡 " + "Hint: to update a choice, select one of the choice keys (" + chalk.yellow("yellow text") + ") and issue " + chalk.blue.bold(appName(providedOptions) + " profile edit " + chalk.yellow('<choiceKey>')))
    },
  }
}
