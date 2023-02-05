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

import { CommandModule } from "yargs"

import Opts from "../../options.js"
import { MadWizardOptions } from "../../../MadWizardOptions.js"

import getProfile from "./get.js"
import editProfile from "./edit.js"
import listProfiles from "./list.js"
import cloneProfile from "./clone.js"
import pruneProfile from "./prune.js"
import deleteProfile from "./delete.js"

export default function profileModule(providedOptions: MadWizardOptions): CommandModule<Opts, Opts> {
  return {
    command: "profile <subcommand>",
    describe: "Commands for view, listing, deleting, and copying profiles",
    builder: (yargs) =>
      yargs
        .command(listProfiles(providedOptions))
        .command(getProfile(providedOptions))
        .command(editProfile(providedOptions))
        .command(deleteProfile(providedOptions))
        .command(cloneProfile(providedOptions))
        .command(pruneProfile(providedOptions)),
    handler: async () => {
      throw new Error("Missing subcommand")
    },
  }
}
