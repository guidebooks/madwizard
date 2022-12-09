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

import Opts, { assembleOptions } from "../options.js"
import { MadWizardOptions } from "../../MadWizardOptions.js"

type BuildOpts = Opts & {
  input: string
  srcDir: string
  tgtPath: string
}

function buildBuilder(yargs: Argv<Opts>): Argv<BuildOpts> {
  return yargs
    .positional("srcDir", {
      type: "string",
      describe: "Directory enclosing source content",
    })
    .positional("input", {
      type: "string",
      describe: "Path inside of srcDir to process",
    })
    .positional("tgtPath", {
      type: "string",
      describe: "Enclosing directory for generated content",
    })
}

async function buildHandler(providedOptions: MadWizardOptions, argv: BuildOpts) {
  // build and mirror: these allow for static/ahead-of-time
  // fetching and inlining of content. This can be helpful to
  // allow shipping "frozen" forms of content with a build, and
  // capturing remote content at the same time. By inlining the
  // content ("build", and mirror calls build over a directory
  // tree), you can also amortize the cost of many file
  // reads/remote fetches per run.
  const options = assembleOptions(providedOptions, argv)
  const { inliner } = await import("../../../parser/markdown/snippets/inliner.js")
  await inliner(argv.input, argv.srcDir, argv.tgtPath, options)
}

export default function buildModule(
  resolve: (value: unknown) => void,
  reject: (err: Error) => void,
  providedOptions: MadWizardOptions
): CommandModule<Opts, BuildOpts> {
  return {
    command: "build <srcDir> <input> <tgtPath>",
    describe: "Advanced usage: parse the given markdown",
    builder: buildBuilder,
    handler: (argv) => buildHandler(providedOptions, argv).then(resolve, reject),
  }
}
