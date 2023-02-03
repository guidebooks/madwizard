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
  profile: string
}

type SrcProfileOpts = {
  srcProfile: string
}

type TargetProfileOpts = {
  tgtProfile: string
}

function namedProfileBuilder(yargs: Argv<Opts>): Argv<NamedProfileOpts> {
  return yargs.positional("profile", {
    type: "string",
    describe: "Name of a profile",
  })
}

function srcAndTargetNamedProfileBuilder(yargs: Argv<Opts>): Argv<SrcProfileOpts & TargetProfileOpts> {
  return yargs
    .positional("srcProfile", {
      type: "string",
      describe: "Name of source profile",
    })
    .positional("tgtProfile", {
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
          command: "list",
          describe: "List your profiles",
          handler: async () => {
            const [ui, profiles] = await Promise.all([
              import("../../profiles/table.js").then((_) => _.default),
              import("../../../profiles/list.js").then((_) => _.default(providedOptions)),
            ])
            console.log(ui(profiles))
          },
        })
        .command({
          command: "get <profile>",
          describe: "Get the details of a profile",
          builder: namedProfileBuilder,
          handler: async (argv) => {
            const [ui, profile] = await Promise.all([
              import("../../profiles/details.js").then((_) => _.default),
              import("../../../profiles/get.js").then((_) => _.default(providedOptions, argv.profile)),
            ])
            console.log(await ui(profile))

            // TODO:
            // const chalk = await import('chalk').then(_ => _.default)
            // console.error("💡 " + "Hint: to update a choice, select one of the choice keys (" + chalk.yellow("yellow text") + ") and issue " + chalk.blue.bold(appName(providedOptions) + " profile edit " + chalk.yellow('<choiceKey>')))
          },
        })
        .command({
          command: "delete <profile>",
          describe: "Delete a profile",
          builder: namedProfileBuilder,
          handler: async (argv) => {
            await import("../../../profiles/delete.js").then((_) => _.default(providedOptions, argv.profile))
          },
        })
        .command({
          command: "clone <srcProfile> <dstProfile>",
          describe: "Copy the choices in a source profile to a new destination profile",
          builder: srcAndTargetNamedProfileBuilder,
          handler: async (argv) => {
            await import("../../../profiles/clone.js").then((_) =>
              _.default(providedOptions, argv.srcProfile, argv.tgtProfile)
            )
          },
        }),
    handler: async () => {
      throw new Error("Missing subcommand")
    },
  }
}
