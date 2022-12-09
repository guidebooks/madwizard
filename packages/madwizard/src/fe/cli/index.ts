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
// import { DebugTask, isDebugTask } from "./tasks.js"

import jsonModule from "./commands/json.js"
import planModule from "./commands/plan.js"
import buildModule from "./commands/build.js"
import mirrorModule from "./commands/mirror.js"
import profileModule from "./commands/profile.js"
import guideModule, { guideHandler } from "./commands/guide.js"

import { MadWizardOptions } from "../MadWizardOptions.js"

type Opts = {
  "--"?: string[]

  /** Name for the set of stored answers to questions */
  profile?: string | false

  /** Path to guidebook store */
  store?: string

  narrow?: boolean
  raw?: boolean
  "raw-prefix"?: string
  quiet?: boolean

  /** Emit extra low-level content, such as command lines and env var updates */
  verbose?: boolean

  /**
   * Assert an answer to a question (of the form question=answer,
   * where question is the path of the guidebook containing the
   * question).
   */
  assert?: string

  /**
   * Whereas assert means ignore the answer in the profile, use the
   * value provided here, veto means just ignore the answer to the
   * question in the profile (also of the form question=answer, where
   * question is the path of the guidebook containing the question).
   */
  veto?: string

  /** Whether or not to use platform detection logic */
  aprioris?: boolean

  /** Optimization settings */
  optimize?: number | false

  /** Accept all prior choices */
  yes?: boolean
}

//async function enableTracing(task: DebugTask, subtask = "*") {
//  await import("debug").then((_) => _.default.enable(`madwizard/${task.replace(/^debug:/, "")}/${subtask}`))
//}

/** Example command lines */
const examples: [[string, string]] = [[chalk.yellow("$0 guide demo/hello"), "A hello world example"]]

export async function cli<Writer extends Writable["write"]>(
  _argv: string[],
  write?: Writer,
  providedOptions: MadWizardOptions = {},
  ui?: UI<string>
) {
  return new Promise((resolve, reject) => {
    const parser: Argv<Opts> = yargs()
      .scriptName(chalk.bold("madwizard"))
      .version(version())
      .wrap(null) // no artificial wrapping
      .updateStrings({
        "Options:": chalk.bold.blue("Options:"),
        "Commands:": chalk.bold.blue("Commands:"),
        "Examples:": chalk.bold.blue("Examples:"),
        boolean: chalk.cyan("boolean"),
        string: chalk.cyan("string"),
        number: chalk.cyan("number"),
        "default:": chalk.yellow("default:"),
      })
      .parserConfiguration({
        // parse out the "-- <rest>" part of the command line
        "populate--": true,
      })
      .options({
        profile: {
          alias: "p",
          type: "string",
          describe: "Use a given named profile to remember your choices",
        },
        store: {
          type: "string",
          describe: "Path to root of guidebook store",
        },
        interactive: {
          alias: "i",
          type: "boolean",
          default: true,
          describe: "Always ask questions",
        },
        yes: {
          alias: "y",
          type: "boolean",
          describe: "Auto-accept all prior answers from your profile",
        },
        narrow: {
          alias: "n",
          type: "boolean",
          describe: "Try to fit in a narrower viewport",
        },
        verbose: {
          alias: "V",
          type: "boolean",
          describe: "Emit extra low-level content, such as command lines and env var updates",
        },
        raw: {
          alias: "r",
          type: "boolean",
          describe: "Advanced usage: emit computer-readable output for Q&A interactions",
        },
        "raw-prefix": {
          type: "string",
          describe: "Advanced usage: when emitting raw output, prefix every line with this string",
        },
        aprioris: {
          type: "boolean",
          default: true,
          describe: "Whether or not to use automatic platform detection logic",
        },
        optimize: {
          alias: "O",
          type: "number",
          default: 1,
          describe: "Whether or not to optimize the plan",
        },
        quiet: {
          alias: "q",
          type: "boolean",
          describe: "Try to emit as little superfluous output as possible",
        },
        assert: {
          type: "string",
          describe: 'Assert the answer to a question (of the form "question=answer")',
        },
        veto: {
          type: "string",
          describe: 'Veto the answer to a question that may be in the profile (of the form "question=answer")',
        },
      })
      .showHelpOnFail(false, "Specify --help for available options")
      .help()
      .alias("help", "h")
      .example(examples)
      .command(guideModule("guide", resolve, reject, providedOptions, write, ui))
      .command(guideModule("run", resolve, reject, providedOptions, write, ui))
      .command(buildModule(resolve, reject, providedOptions))
      .command(mirrorModule(resolve, reject, providedOptions))
      .command(jsonModule(resolve, reject, providedOptions, write))
      .command(planModule(resolve, reject, providedOptions, write))
      .command(profileModule(providedOptions))

      .demandCommand()
      .strict()
      .fail((msg, err, yargs) => {
        if (!err && /Unknown argument/.test(msg)) {
          // failsafe: assume they are running a guide
          guideHandler("guide", providedOptions, { input: _argv[1], _: _argv, $0: "madwizard" }, write, ui).then(
            resolve,
            reject
          )
        } else {
          yargs.showHelp()
          reject(err)
        }
      })

    return parser.parseAsync(_argv.slice(1))
  })
}

/*    


    /* .command("vetos", "", async () => {
      (write || process.stdout.write.bind(process.stdout))(
        await vetoesToString(blocks, choices, await makeMemos(), options)
      )
      }) */
