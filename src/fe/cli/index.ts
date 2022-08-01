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

import yargs from "yargs-parser"
import { Writable } from "stream"

import usage from "./usage.js"
import defaultOptions from "./defaults.js"
import { DebugTask, isDebugTask, isValidTask, taskHasNoArgs } from "./tasks.js"

import { MadWizardOptions } from "../MadWizardOptions.js"

function assertExhaustive(value: never, message = "Reached unexpected case in exhaustive switch"): never {
  throw new Error(message)
}

async function enableTracing(task: DebugTask, subtask = "*") {
  await import("debug").then((_) => _.default.enable(`madwizard/${task.replace(/^debug:/, "")}/${subtask}`))
}

export async function cli<Writer extends Writable["write"]>(
  _argv: string[],
  write?: Writer,
  providedOptions: MadWizardOptions = {}
) {
  const parsedOptions = yargs(_argv, {
    configuration: { "populate--": true }, // parse out the "-- <rest>" part of the command line
    alias: { profile: ["p"], narrow: ["n"], interactive: ["i"], verbose: ["V"] },
    boolean: [
      "no-profile",
      "narrow",
      "n",
      "interactive",
      "i",
      "0O",
      "no-optimize",
      "no-aprioris",
      "no-validate",
      "verbose",
      "V",
      "dry-run",
    ],
  })
  const argv = parsedOptions._

  if (argv[1] === "version") {
    return import("../../version.js").then((_) => _.version())
  }

  const [{ newChoiceState }, { compile, order, vetoesToString }] = await Promise.all([
    import("../../choices/index.js"),
    import("../../graph/index.js"),
  ])

  const task = !argv[2] && !taskHasNoArgs(argv[1]) ? "guide" : (argv[1] || "").toString()
  const input = (argv[2] || argv[1] || "").toString()

  const veto = !parsedOptions.veto ? undefined : new RegExp(parsedOptions.veto)
  const mkdocs = parsedOptions.mkdocs
  const narrow = parsedOptions.narrow
  const profileFromCommandLine = parsedOptions.profile === false ? undefined : parsedOptions.profile
  const noProfile = parsedOptions["no-profile"]
  const profilesPath = parsedOptions["profiles-path"]

  // don't actually execute anything, but making choices and
  // validation and expanding lists is ok
  const dryRun = parsedOptions["dry-run"]

  const interactive = parsedOptions.interactive
  const noOptimize = parsedOptions.O0 || parsedOptions.optimize === false || parsedOptions.optimize === 0 || undefined
  const noAprioris = parsedOptions["no-aprioris"]
  const noValidate = parsedOptions["no-validate"]
  const verbose = parsedOptions.verbose

  // optimization settings
  const optimize = noOptimize ? false : { aprioris: !noAprioris, validate: !noValidate }

  // base uri of guidebook store; this will allow users to type
  // shortnames for books in the store
  const store = parsedOptions.store

  const commandLineOptions: MadWizardOptions = {}
  if (interactive !== undefined) {
    commandLineOptions.interactive = interactive
  }
  if (veto !== undefined) {
    commandLineOptions.veto = veto
  }
  if (dryRun !== undefined) {
    commandLineOptions.dryRun = dryRun
  }
  if (mkdocs !== undefined) {
    commandLineOptions.mkdocs = mkdocs
  }
  if (profileFromCommandLine !== undefined) {
    commandLineOptions.profile = profileFromCommandLine
  }
  if (narrow !== undefined) {
    commandLineOptions.narrow = narrow
  }
  if (optimize !== undefined) {
    commandLineOptions.optimize = optimize
  }
  if (profilesPath !== undefined) {
    commandLineOptions.profilesPath = profilesPath
  }
  if (store !== undefined) {
    commandLineOptions.store = store
  }
  if (verbose !== undefined) {
    commandLineOptions.verbose = verbose
  }
  if (interactive !== undefined) {
    commandLineOptions.interactive = interactive
  }
  const options: MadWizardOptions = Object.assign({}, defaultOptions, commandLineOptions, providedOptions)

  if (!task || !input) {
    return usage(argv)
  }

  if (!isValidTask(task)) {
    return usage(argv, `Invalid task: ${task}`)
  }

  if (isDebugTask(task)) {
    await enableTracing(task)
  }

  // restore choices from profile
  const profile = options.profile
  const suggestions = noProfile
    ? newChoiceState(profile)
    : await import("../../profiles/restore.js").then((_) => _.default(options, profile))

  // if we are doing a run, then use the suggestions as the final
  // choices; otherwise, treat them just as suggestions in the guide
  const choices = task === "run" ? suggestions : newChoiceState(profile)

  // A handler to serialize choices. We will call this after every
  // choice. At exit, make sure to wait for the last persist to finish.
  let lastPersist: ReturnType<typeof setTimeout>
  let lastPersistPromise: Promise<void>
  const persistChoices = () => import("../../profiles/persist.js").then((_) => _.default(options, choices, suggestions))
  if (!noProfile && !process.env.QUIET_CONSOLE) {
    choices.onChoice(() => {
      // persist choices after every choice is made, and remember the
      // async, so we can wait for it on exit
      if (lastPersist) {
        clearTimeout(lastPersist)
      }

      lastPersist = setTimeout(() => {
        lastPersistPromise = persistChoices()
      }, 50)
    })
  }

  // bump the `lastUsedTime` attribute
  if (!process.env.QUIET_CONSOLE) {
    choices.profile.lastUsedTime = Date.now()
    persistChoices()
  }

  // assert a choice to have a given value
  !_argv.find((_) => _.startsWith("--assert="))
    ? undefined
    : _argv
        .filter((_) => _.startsWith("--assert="))
        .map((_) => _.replace(/^--assert=/, ""))
        .map((_) => _.split(/=/))
        .forEach(([key, value]) => {
          choices.setKey(key, value)
        })

  // build and mirror: these allow for static/ahead-of-time fetching
  // and inlining of content. This can be helpful to allow shipping
  // "frozen" forms of content with a build, and capturing remote
  // content at the same time. By inlining the content ("build", and
  // mirror calls build over a directory tree), you can also amortize
  // the cost of many file reads/remote fetches per run.
  if (task === "build") {
    const { inliner } = await import("../../parser/markdown/snippets/inliner.js")
    await inliner(input, argv[3].toString(), argv[4].toString(), options)
    return
  } else if (task === "mirror") {
    const { mirror } = await import("../../parser/markdown/snippets/mirror.js")
    await mirror(input, argv[3].toString(), undefined, options)
    return
  } else if (task === "profile") {
    return import("../profiles/index.js").then((_) => _.default(argv, options))
  }

  /** @return the block model, either by using a precompiled model from the store, or by parsing the source */
  const getBlocksModel = async () => {
    // check to see if the compiled model exists
    const [{ access, readFile }, { targetPathForAst }] = await Promise.all([
      import("fs/promises"),
      import("../../parser/markdown/snippets/mirror-paths.js"),
    ])

    const ast1 = targetPathForAst(input + "/index.md", options.store)
    const ast2 = targetPathForAst(input + ".md", options.store)
    const mightBeAst = !/\.md$/.test(input) && !/^http/.test(options.store)
    const [exists1, exists2] = await Promise.all([
      !mightBeAst
        ? ""
        : access(ast1)
            .then(() => ast1)
            .catch(() => ""),
      !mightBeAst
        ? ""
        : access(ast2)
            .then(() => ast2)
            .catch(() => ""),
    ])
    if (exists1 || exists2) {
      // yes! the pre-parsed ast model exists
      const { populateAprioris } = await import("../../choices/groups/index.js")
      await populateAprioris(choices, options)
      return JSON.parse(await readFile(exists1 || exists2).then((_) => _.toString()))
    } else {
      // no! we need to parse it from the source (much slower)
      const [{ madwizardRead }, { parse }] = await Promise.all([
        import("./madwizardRead.js"),
        import("../../parser/index.js"),
      ])
      return parse(input, madwizardRead, choices, undefined, options).then((_) => _.blocks)
    }
  }

  // this is the block model we parse from the source
  const blocks = await getBlocksModel()

  // @return a new Memoizer
  const makeMemos = async () => {
    const Memoizer = await import("../../memoization/index.js").then((_) => _.Memoizer)
    const memos = new Memoizer(suggestions)

    // allow guidebooks to selectively inject -- <rest> arguments into shell commands
    memos.env.GUIDEBOOK_DASHDASH = parsedOptions["--"] ? parsedOptions["--"].join(" ") : ""

    return memos
  }

  switch (task) {
    case "version":
      break

    case "debug:graph":
    case "debug:topmatter":
      // these tasks depend only on `parse` having been called
      break

    case "debug:groups":
    case "debug:timing":
    case "debug:fetch": {
      // print out timing
      const memos = await makeMemos()
      const graph = await compile(blocks, choices, memos, options)
      await import("../../wizard/index.js").then((_) => _.wizardify(graph, memos))

      await import("../tree/index.js").then((_) => new _.Treeifier(new _.DevNullUI()).toTree(order(graph)))
      break
    }

    case "plan":
      await import("../tree/index.js").then((_) =>
        _.prettyPrintUITreeFromBlocks(blocks, choices, Object.assign({ write }, options))
      )
      break

    case "vetoes": {
      (write || process.stdout.write.bind(process.stdout))(
        await vetoesToString(blocks, choices, await makeMemos(), options)
      )
      break
    }

    case "json": {
      const { EOL } = await import("os")
      const memos = await makeMemos()
      const graph = await compile(blocks, choices, memos, options)
      const wizard = await import("../../wizard/index.js").then((_) => _.wizardify(graph, memos))
      ;(write || process.stdout.write.bind(process.stdout))(
        JSON.stringify(
          wizard,
          (key, value) => {
            if (key === "source" || key === "position") {
              return "placeholder"
            } else if (key === "key" || key === "id") {
              return "somekey"
            } else if (key === "description" && !value) {
              return undefined
            } else if (key === "nesting" && Array.isArray(value)) {
              return undefined
            } else if (key === "barrier" && value === false) {
              return undefined
            } else if (key === "status" && value === "blank") {
              return undefined
            } else {
              return value
            }
          },
          2
        ) + EOL
      )
      break
    }

    case "run":
    case "guide": {
      const [memoizer, Guide] = await Promise.all([makeMemos(), import("../guide/index.js").then((_) => _.Guide)])

      /** Kill any spawned subprocesses */
      const cleanExit = memoizer.cleanup.bind(memoizer)
      const cleanExitFromSignal = () => {
        console.error("⚠️ Exiting now, please wait for us to gracefully clean things up")
        cleanExit()
      }
      process.on("SIGINT", cleanExitFromSignal) // catch ctrl-c
      process.on("SIGTERM", cleanExitFromSignal) // catch kill

      try {
        await new Guide(task, blocks, choices, options, memoizer, undefined, write).run()
      } finally {
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
      }

      return {
        cleanExit,
        env: memoizer.env,
      }
    }

    default:
      // if our switch isn't exhaustive, you will see this typescript error:
      // Argument of type 'string' is not assignable to parameter of type 'never'.
      assertExhaustive(task)
  }
}
