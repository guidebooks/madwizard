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
import { basename } from "path"
import { Writable } from "stream"
import yargs from "yargs"

import { UI } from "../tree/index.js"
import version from "../../version.js"

import fail from "./commands/fail.js"
import json from "./commands/json/index.js"
import plan from "./commands/plan/index.js"
import guide, { GuideRet } from "./commands/guide/index.js"
import mirror from "./commands/mirror.js"
import profile from "./commands/profile.js"

import { MadWizardOptions } from "../MadWizardOptions.js"

import strings from "./strings.js"
import examples from "./examples.js"
import { globalCommandLineOptions, parserConfiguration } from "./options.js"

function hasCode(err?: Error): err is Error & { code: number | string } {
  return err && typeof (err as unknown as { code: number | string }).code !== undefined
}

export async function cli<Writer extends Writable["write"]>(
  _argv: string[],
  write?: Writer,
  providedOptions: MadWizardOptions = {},
  ui?: UI<string>
) {
  const argv = _argv.slice(1)

  return new Promise<GuideRet>((resolve, reject) => {
    const reject2 = (err: Error) => {
      reject(
        hasCode(err) && err.code === "ENOENT"
          ? new Error(
              chalk.red(
                "Guidebook not found: " +
                  err.message.replace(/ENOENT: no such file or directory, open '(.+)'/, (_, p1) => basename(p1))
              )
            )
          : err
      )
    }

    const parser = yargs()
      .help() // install a --help handler
      .strict() // fail if an option is not recognized
      .wrap(null) // no artificial wrapping
      .demandCommand() // fail if yargs doesn't find one of our commands
      .example(examples())
      .version(version())
      .updateStrings(strings) // pretty-print some of the help output
      .options(globalCommandLineOptions)
      .scriptName(chalk.bold("madwizard"))
      .parserConfiguration(parserConfiguration)
      .command(guide("guide", resolve, reject2, providedOptions, write, ui))
      .command(profile(providedOptions))
      .command(plan(providedOptions, write))
      .command(mirror(providedOptions))
      .command(json(providedOptions, write))
      .command(guide("run", resolve, reject2, providedOptions, write, ui, false)) // false hides this from help
      .showHelpOnFail(false, "Specify --help for available options")

    parser.fail(fail(parser, argv))

    return parser.parseAsync(argv).catch(reject2)
  })
}

/*    


    /* .command("vetos", "", async () => {
      (write || process.stdout.write.bind(process.stdout))(
        await vetoesToString(blocks, choices, await makeMemos(), options)
      )
      }) */
