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

import chalk from "chalk"
import { Writable } from "stream"
import yargs, { Argv } from "yargs"

import { UI } from "../tree/index.js"
import version from "../../version.js"

import fail from "./commands/fail.js"
import json from "./commands/json.js"
import plan from "./commands/plan.js"
import build from "./commands/build.js"
import guide from "./commands/guide.js"
import mirror from "./commands/mirror.js"

import { MadWizardOptions } from "../MadWizardOptions.js"

import strings from "./strings.js"
import examples from "./examples.js"
import { Opts, commandLineOptions, parserConfiguration } from "./options.js"

export async function cli<Writer extends Writable["write"]>(
  argv: string[],
  write?: Writer,
  providedOptions: MadWizardOptions = {},
  ui?: UI<string>
) {
  return new Promise((resolve, reject) => {
    const parser: Argv<Opts> = yargs()
      .help() // install a --help handler
      .strict() // fail if an option is not recognized
      .wrap(null) // no artificial wrapping
      .demandCommand() // fail if yargs doesn't find one of our commands
      .example(examples())
      .version(version())
      .updateStrings(strings) // pretty-print some of the help output
      .options(commandLineOptions)
      .scriptName(chalk.bold("madwizard"))
      .parserConfiguration(parserConfiguration)
      .command(guide("guide", resolve, reject, providedOptions, write, ui))
      .command(guide("run", resolve, reject, providedOptions, write, ui))
      .command(build(resolve, reject, providedOptions))
      .command(mirror(resolve, reject, providedOptions))
      .command(json(resolve, reject, providedOptions, write))
      .command(plan(resolve, reject, providedOptions, write))
      .showHelpOnFail(false, "Specify --help for available options")
      .fail(fail(resolve, reject, providedOptions, argv, write, ui))

    return parser.parseAsync(argv.slice(1))
  })
}

/*    


    /* .command("vetos", "", async () => {
      (write || process.stdout.write.bind(process.stdout))(
        await vetoesToString(blocks, choices, await makeMemos(), options)
      )
      }) */
