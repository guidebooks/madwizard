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

import { Writable } from "stream"
import { CommandModule } from "yargs"

import Opts from "../../options.js"
import { MadWizardOptions } from "../../../MadWizardOptions.js"

import builder from "./builder.js"
import handler from "./handler.js"
import JsonOpts from "./options.js"

export default function jsonModule<Writer extends Writable["write"]>(
  resolve: (value: unknown) => void,
  reject: (err: Error) => void,
  providedOptions: MadWizardOptions,
  write: Writer
): CommandModule<Opts, JsonOpts> {
  return {
    command: "json <input>",
    describe: "Parse a given markdown and print the raw execution plan model as JSON",
    builder,
    handler: (argv) => handler(providedOptions, argv, write).then(resolve, reject),
  }
}
