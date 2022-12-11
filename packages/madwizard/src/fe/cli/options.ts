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

import { group } from "./strings.js"
import defaultOptions from "./defaults.js"
import { MadWizardOptions } from "../MadWizardOptions.js"

export type Opts = {
  /** Name for the set of stored answers to questions */
  profile?: string | false

  /** Path to guidebook store */
  store?: string

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

const expert = group("Expert Options:")

/** Yargs `.options()` struct */
export const globalCommandLineOptions = {
  profile: {
    alias: "p",
    type: "string" as const,
    describe: "Use a given named profile to remember your choices",
  },
  store: {
    alias: "s",
    type: "string" as const,
    describe: "Path to root of guidebook store",
  },
  aprioris: {
    type: "boolean" as const,
    default: true,
    group: expert,
    describe: "Whether or not to use automatic platform detection logic",
  },
  optimize: {
    alias: "O",
    type: "number" as const,
    default: 1,
    group: expert,
    describe: "Whether or not to optimize the plan",
  },
  assert: {
    type: "string" as const,
    group: expert,
    describe: 'Assert the answer to a question (of the form "question=answer")',
  },
  veto: {
    type: "string" as const,
    group: expert,
    describe: 'Veto the answer to a question that may be in the profile (of the form "question=answer")',
  },
}

export const parserConfiguration: Partial<ParserConfigurationOptions> = {
  // parse out the "-- <rest>" part of the command line
  "populate--": true,
}

export default Opts
