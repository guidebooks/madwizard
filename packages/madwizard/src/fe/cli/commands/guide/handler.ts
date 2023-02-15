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
import Debug from "debug"
import { Writable } from "stream"
import { Arguments } from "yargs"

import { UI } from "../../../tree/index.js"
import { MadWizardOptionsWithInput } from "../../../MadWizardOptions.js"

import { getBlocksModel, loadAssertions, loadSuggestions, makeMemos } from "../util.js"

import GuideOpts, { assembleOptionsForGuide } from "./options.js"

export type GuideRet = {
  cleanExit: (signal?: "SIGINT" | "SIGTERM") => void
  env: typeof process.env
}

export default async function guideHandler<Writer extends Writable["write"]>(
  task: "run" | "guide",
  providedOptions: MadWizardOptionsWithInput,
  argv: Arguments<GuideOpts>,
  write?: Writer,
  ui?: UI<string>
) {
  const { input } = argv
  const noProfile = argv.profile === false

  const options = assembleOptionsForGuide(providedOptions, argv)
  if (options.quiet) {
    process.env.QUIET_CONSOLE = "true"
  }

  const newChoiceState = await import("../../../../choices/index.js").then((_) => _.newChoiceState)

  // restore choices from profile
  const profile = options.profile
  const suggestions = await loadSuggestions(argv, options)

  // if we are doing a run, then use the suggestions as the final
  // choices; otherwise, treat them just as suggestions in the guide
  const choices = loadAssertions(task === "run" ? suggestions : newChoiceState(profile), providedOptions, argv)

  // A handler to serialize choices. We will call this after every
  // choice. At exit, make sure to wait for the last persist to finish.
  let lastPersist: ReturnType<typeof setTimeout>
  let lastPersistPromise: Promise<void>
  const persistChoices = () =>
    import("../../../../profiles/persist.js").then((_) => _.default(options, choices, suggestions))
  if (!noProfile && !process.env.QUIET_CONSOLE) {
    choices.onChoice(() => {
      // persist choices after every choice is made, and remember the
      // async, so we can wait for it on exit
      if (lastPersist) {
        clearTimeout(lastPersist)
      }

      lastPersist = setTimeout(() => {
        lastPersist = undefined
        lastPersistPromise = persistChoices().then(() => {
          lastPersistPromise = undefined
        })
      }, 50)
    })
  }

  // bump the `lastUsedTime` attribute
  if (!process.env.QUIET_CONSOLE && !noProfile && options.bump !== false) {
    choices.profile.lastUsedTime = Date.now()
    persistChoices()
  }

  // this is the block model we parse from the source
  // re: | "-", see https://github.com/yargs/yargs/issues/1312
  const blocks = await getBlocksModel(input || "-", choices, options)

  // a name we might want to associate with the run, in the logs
  const name = options.name ? ` (${options.name})` : ""

  const exitMessage = "⚠️  " + chalk.yellow(`Exiting${name} now, please wait for us to gracefully clean things up`)
  const [memoizer, Guide] = await Promise.all([
    makeMemos(suggestions, argv),
    import("../../../guide/index.js").then((_) => _.Guide),
  ])

  const guide = new Guide(task, blocks, choices, options, memoizer, ui, write)

  /** Kill any spawned subprocesses */
  let cleanExitPromise: Promise<void> | null = null
  const cleanExit = async (signal?: Parameters<import("../../../../memoization/index.js").Memos["cleanup"]>[0]) => {
    if (!cleanExitPromise) {
      // eslint-disable-next-line no-async-promise-executor
      cleanExitPromise = new Promise(async (resolve) => {
        Debug("madwizard/cleanup")("memoizer.currentlyNeedsCleanup", memoizer.currentlyNeedsCleanup())
        Debug("madwizard/cleanup")("guide.currentlyNeedsCleanup", guide.currentlyNeedsCleanup())
        if (memoizer.currentlyNeedsCleanup() || guide.currentlyNeedsCleanup()) {
          console.error(exitMessage)

          try {
            Debug("madwizard/cleanup")("attempting a clean exit", signal)
            await Promise.all([memoizer.cleanup(signal), guide.onExitSignalFromUser(signal)])
          } catch (err) {
            console.error(err)
          } finally {
            Debug("madwizard/cleanup")("attempting a clean exit... done", signal)
          }
        }
        resolve()
      })
    }
    await cleanExitPromise
  }
  const cleanExitFromSIGINT = async () => {
    Debug("madwizard/cleanup")("Received interrupt")
    await cleanExit("SIGINT")
    Debug("madwizard/cleanup")("Received interrupt... done processing handler")
  }
  const cleanExitFromSIGTERM = async () => {
    Debug("madwizard/cleanup")("Received termination request")
    await cleanExit("SIGTERM")
  }
  process.once("SIGINT", cleanExitFromSIGINT) // catch ctrl-c
  process.once("SIGTERM", cleanExitFromSIGTERM) // catch kill

  if (providedOptions.onBeforeRun) {
    providedOptions.onBeforeRun({ cleanExit })
  }

  try {
    await guide.run()
  } finally {
    //    if (options.verbose && task !== "run") {
    //      console.error(exitMessage)
    //    }
    if (!noProfile) {
      if (lastPersistPromise) {
        // wait for the last choice persistence operation to
        // complete before we exit
        await lastPersistPromise
      } else if (lastPersist) {
        // then we have a scheduled async; cancel that and save
        // immediately
        clearTimeout(lastPersist)
        await persistChoices()
      }
    }

    if (options.clean !== false) {
      cleanExit()
    }

    // in case we were launched as part of some parent, not a
    // standalone process, make sure to deregister here:
    process.off("SIGINT", cleanExitFromSIGINT) // catch ctrl-c
    process.off("SIGTERM", cleanExitFromSIGTERM) // catch kill
  }

  return {
    cleanExit,
    env: memoizer.env,
  }
}
