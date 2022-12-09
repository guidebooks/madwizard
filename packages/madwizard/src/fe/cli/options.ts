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

import defaultOptions from "./defaults.js"
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

/**
 * Combine options provided by the programmatic caller
 * `providedOptions` with options flowing in from the command line.
 *
 */
export function assembleOptions(
  providedOptions: MadWizardOptions,
  commandLineOptions: Opts
): MadWizardOptions & Omit<Opts, "optimize" | "veto"> {
  const opts: MadWizardOptions = Object.assign(
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

  if (commandLineOptions.veto !== undefined) {
    opts.veto = new RegExp(commandLineOptions.veto)
  }

  return opts
}

export default Opts
