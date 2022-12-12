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

import { Argv, CommandModule } from "yargs"

import Opts from "../options.js"
import { MadWizardOptions } from "../../MadWizardOptions.js"

type NamedProfileOpts = Opts & {
  profileName: string
}

type NamedProfile2Opts = {
  profileName2: string
}

function namedProfileBuilder(yargs: Argv<Opts>): Argv<NamedProfileOpts> {
  return yargs.positional("profileName", {
    type: "string",
    describe: "Name of a profile",
  })
}

function srcAndTargetNamedProfileBuilder(yargs: Argv<Opts>): Argv<NamedProfileOpts & NamedProfile2Opts> {
  return namedProfileBuilder(yargs).positional("profileName2", {
    type: "string",
    describe: "Name of target profile",
  })
}

export default function profileModule(providedOptions: MadWizardOptions): CommandModule<Opts, Opts> {
  return {
    command: "profile <subcommand>",
    describe: "Commands for view, listing, deleting, and copying profiles",
    builder: (yargs) =>
      yargs
        .command({
          command: "get",
          describe: "List your named profiles",
          handler: async () => {
            const [ui, profiles] = await Promise.all([
              import("../../profiles/table.js").then((_) => _.default),
              import("../../../profiles/list.js").then((_) => _.default(providedOptions)),
            ])
            console.log(ui(profiles))
          },
        })
        .command({
          command: "delete <profile>",
          describe: "Delete a named profile",
          builder: namedProfileBuilder,
          handler: async (argv) => {
            const { profileName } = argv
            await import("../../../profiles/delete.js").then((_) => _.default(providedOptions, profileName))
          },
        })
        .command({
          command: "clone <srcProfile> <dstProfile>",
          describe: "Copy the choices in a source profile to a new destination profile",
          builder: srcAndTargetNamedProfileBuilder,
          handler: async (argv) => {
            const { profileName, profileName2 } = argv
            await import("../../../profiles/clone.js").then((_) =>
              _.default(providedOptions, profileName, profileName2)
            )
          },
        }),
    handler: async () => {
      throw new Error("Missing subcommand")
    },
  }
}
