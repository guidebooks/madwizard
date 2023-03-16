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

/** madwizard profile list */
export default function listProfiles(providedOptions: MadWizardOptions) {
  return {
    command: "list [name]",
    describe: "List your profiles",
    builder: namedProfileBuilder,
    handler: async (argv) => {
      const [ui, profiles] = await Promise.all([
        import("../../../profiles/table.js").then((_) => _.default),
        import("../../../../profiles/list.js")
          .then((_) => _.default(providedOptions))
          .then((_) => _.filter((_) => !argv.name || _.profile.name === argv.name)),
      ])

      if (profiles.length > 0) {
        console.log(ui(profiles))
      }
    },
  }
}
