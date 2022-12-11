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
}

export type GuideOpts = InputOpts &
  CommonOpts & {
    /** Accept all prior choices */
    yes?: boolean

    /** Run in interactive mode, and overridden by value of `yes` (default: true) */
    interactive?: boolean

    /** Emit computer-readable output for Q&A interactions */
    raw?: boolean

    /** When emitting raw output, prefix every line with this string */
    "raw-prefix"?: string
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
    default: true,
    group: expertGroup,
    describe: "Always ask questions",
  },
  raw: {
    alias: "r",
    type: "boolean" as const,
    group: developersGroup,
    describe: "Emit computer-readable output for Q&A interactions",
  },
  "raw-prefix": {
    type: "string" as const,
    group: developersGroup,
    describe: "When emitting raw output, prefix every line with this string",
  },
}

export function assembleOptionsForGuide(providedOptions: MadWizardOptions, commandLineOptions: Arguments<GuideOpts>) {
  return Object.assign({}, assembleOptions(providedOptions, commandLineOptions), {
    veto: commandLineOptions.veto === undefined ? undefined : new RegExp(commandLineOptions.veto),
  })
}
