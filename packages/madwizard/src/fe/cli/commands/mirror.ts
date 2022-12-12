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

import advanced from "./advanced.js"
import Opts, { assembleOptions } from "../options.js"
import { MadWizardOptions } from "../../MadWizardOptions.js"

type MirrorOpts = Opts & {
  srcDir: string
  tgtDir: string
}

function mirrorBuilder(yargs: Argv<Opts>): Argv<MirrorOpts> {
  return yargs
    .positional("srcDir", {
      type: "string",
      describe: "Directory enclosing source content",
    })
    .positional("tgtDir", {
      type: "string",
      describe: "Enclosing directory for generated content",
    })
}

export default function mirrorModule(
  resolve: (value: unknown) => void,
  reject: (err: Error) => void,
  providedOptions: MadWizardOptions
): CommandModule<Opts, MirrorOpts> {
  return {
    command: "mirror <srcDir> <tgtDir>",
    describe: advanced("Preprocess a directory of markdowns to allow for faster loading"),
    builder: mirrorBuilder,
    handler: async (argv) => {
      const options = assembleOptions(providedOptions, argv)
      const { mirror } = await import("../../../parser/markdown/snippets/mirror.js")
      await mirror(argv.srcDir, argv.tgtDir, undefined, options)
    },
  }
}
