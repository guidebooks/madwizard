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

import { Arguments, ParserConfigurationOptions } from "yargs"

import defaultOptions from "./defaults.js"
import { MadWizardOptions } from "../MadWizardOptions.js"

export type Opts = {
  /** Name for the set of stored answers to questions */
  profile?: string | false

  /** Path to guidebook store */
  store?: string

  /** Internal: everything after the -- on the command line */
  "--"?: string[]
}

/**
 * Combine options provided by the programmatic caller
 * `providedOptions` with options flowing in from the command line.
 *
 */
export function assembleOptions<T>(
  providedOptions: MadWizardOptions,
  commandLineOptions: Arguments<T>
): MadWizardOptions & T /* Omit<Opts, "optimize" | "veto"> */ {
  const opts: MadWizardOptions & T = Object.assign(
    { name: process.env.GUIDEBOOK_NAME },
    defaultOptions,
    commandLineOptions,
    providedOptions
  )
  if (providedOptions.interactive == undefined && providedOptions.ifor === undefined && commandLineOptions.yes) {
    providedOptions.interactive = false
  }

  if (typeof opts.veto === "string") {
    opts.veto = new RegExp(opts.veto)
  }

  const noOptimize = commandLineOptions.optimize === 0 || commandLineOptions.optimize === false || undefined
  const noAprioris =
    commandLineOptions["aprioris"] === false ||
    (typeof providedOptions.optimize === "object" && providedOptions.optimize.aprioris === false)
  const noValidate = commandLineOptions["validate"] === false

  // optimization settings
  const optimize = noOptimize
    ? false
    : providedOptions.optimize === undefined
    ? { aprioris: !noAprioris, validate: !noValidate }
    : providedOptions.optimize
  opts.optimize = optimize

  return opts
}

/** Yargs `.options()` struct */
export const globalCommandLineOptions = {
  profile: {
    alias: "p",
    type: "string" as const,
    default: "default",
    describe: "Use a given named profile to remember your choices",
  },
  store: {
    alias: "s",
    type: "string" as const,
    describe: "Path to root of guidebook store",
  },
}

export const parserConfiguration: Partial<ParserConfigurationOptions> = {
  // parse out the "-- <rest>" part of the command line
  "populate--": true,
}

export default Opts
