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

import { Arguments } from "yargs"

import { MadWizardOptions } from "../../../MadWizardOptions.js"

import { InputOpts } from "../input.js"
import { group } from "../../strings.js"
import { assembleOptions } from "../../options.js"

export type CommonOpts = {
  /** Emit extra low-level content, such as command lines and env var updates */
  verbose?: boolean

  /** Try to emit as little superfluous output as possible */
  quiet?: boolean

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
}

type GuideOpts = InputOpts &
  CommonOpts & {
    /** Accept all prior choices */
    yes?: boolean

    /** Run in interactive mode, and overridden by value of `yes` (default: true) */
    interactive?: boolean

    /** Emit computer-readable output for Q&A interactions. When emitting raw output, prefix every line with this string. */
    raw?: string
  }

const mainGroup = group("Guide Options:")
const expertGroup = group("Guide Options (Advanced):")
const developersGroup = group("Guide Options (Developers):")

export const commonOptions = {
  verbose: {
    alias: "V",
    type: "boolean" as const,
    group: mainGroup,
    describe: "Emit extra low-level content, such as command lines and env var updates",
  },
  quiet: {
    alias: "q",
    type: "boolean" as const,
    group: expertGroup,
    describe: "Try to emit as little superfluous output as possible",
  },
  aprioris: {
    type: "boolean" as const,
    default: true,
    group: expertGroup,
    describe: "Whether or not to use automatic platform detection logic",
  },
  optimize: {
    alias: "O",
    type: "number" as const,
    default: 1,
    group: expertGroup,
    describe: "Whether or not to optimize the plan",
  },
  assert: {
    type: "string" as const,
    group: expertGroup,
    describe: 'Assert the answer to a question (of the form "question=answer")',
  },
  veto: {
    type: "string" as const,
    group: expertGroup,
    describe: 'Veto the answer to a question that may be in the profile (of the form "question=answer")',
  },
}

export const guideOptions = {
  yes: {
    alias: "y",
    type: "boolean" as const,
    group: mainGroup,
    describe: "Auto-accept all prior answers from your profile",
  },
  interactive: {
    alias: "i",
    type: "boolean" as const,
    group: expertGroup,
    describe: "Always ask questions",
  },
  raw: {
    alias: "r",
    type: "string" as const,
    group: developersGroup,
    describe:
      "Emit computer-readable output for Q&A interactions. When emitting raw output, prefix every line with this string.",
  },
}

/**
 * Combine `providedOptions` (those passed programatically) with
 * `commandLineOptions` (those passed on the command line).
 */
export function assembleOptionsForGuide(providedOptions: MadWizardOptions, commandLineOptions: Arguments<GuideOpts>) {
  // interactive... only for a specified guidebook?
  const ifor = providedOptions.ifor || commandLineOptions.ifor

  // Logic: if programmatic options has an opinion, use that; if
  // command line options has an opinion, use that; otherwise, default
  // to interactive mode only if we aren't interactive just for a
  // specified guidebook
  const interactive =
    providedOptions.interactive !== undefined
      ? providedOptions.interactive
      : commandLineOptions.interactive !== undefined
      ? commandLineOptions.interactive
      : commandLineOptions.y !== undefined
      ? !commandLineOptions.y
      : ifor !== undefined
      ? false
      : true

  return Object.assign({}, assembleOptions(providedOptions, commandLineOptions), {
    interactive,
    veto: commandLineOptions.veto === undefined ? undefined : new RegExp(commandLineOptions.veto),
  })
}

export default GuideOpts
