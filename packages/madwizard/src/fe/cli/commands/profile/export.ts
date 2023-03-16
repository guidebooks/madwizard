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

import { Argv } from "yargs"

import Opts from "../../options.js"
import { group } from "../../strings.js"
import { assembleOptions } from "../../options.js"
import { namedProfileBuilder } from "./builder.js"
import { MadWizardOptions } from "../../../MadWizardOptions.js"

function builder(yargs: Argv<Opts>) {
  return namedProfileBuilder(yargs).options({
    prune: {
      type: "boolean" as const,
      default: true,
      describe: "Prune obsolete choices",
      group: group("Export Options"),
    },
  })
}

/** madwizard export profile <profile> */
export default function exportProfile(providedOptions: MadWizardOptions) {
  return {
    command: "export <profile>",
    describe: "Export a profile",
    builder,
    handler: async (argv) => {
      const [profile, { serializeAndRedact }, { prune }] = await Promise.all([
        import("../../../../profiles/restore.js").then((_) => _.default(providedOptions, argv.profile)),
        import("../../../profiles/details.js"),
        import("./prune.js"),
      ])
      const options = assembleOptions(providedOptions, argv)

      if (argv.prune) {
        /* const nPruned = */ await prune(profile, options)
      }

      console.log(serializeAndRedact(profile.profile))
    },
  }
}
