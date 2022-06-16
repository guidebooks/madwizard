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

import { EOL } from "os"
import Debug from "debug"
import { Writable } from "stream"

import usage from "./usage.js"
import { DebugTask, isDebugTask, isValidTask } from "./tasks.js"

import { MadWizardOptions } from "../MadWizardOptions.js"

function assertExhaustive(value: never, message = "Reached unexpected case in exhaustive switch"): never {
  throw new Error(message)
}

function enableTracing(task: DebugTask, subtask = "*") {
  Debug.enable(`madwizard/${task.replace(/^debug:/, "")}/${subtask}`)
}

export async function cli<Writer extends Writable["write"]>(
  _argv: string[],
  write?: Writer,
  providedOptions: MadWizardOptions = {}
) {
  // TODO replace this with yargs or something like that
  const argv = _argv.filter((_, idx) => !/^-/.test(_) && (idx === 0 || !/^--/.test(_argv[idx - 1])))

  if (argv[1] === "version") {
    return import("../../version.js").then((_) => _.version())
  }

  const [{ parse }, { newChoiceState }, { madwizardRead }, { compile, order, vetoesToString }] = await Promise.all([
    import("../../parser/index.js"),
    import("../../choices/index.js"),
    import("./madwizardRead.js"),
    import("../../graph/index.js"),
  ])

  const task = !argv[2] ? "guide" : argv[1]
  const input = argv[2] || argv[1]

  const vetoIdx = _argv.findIndex((_) => new RegExp("^--veto=").test(_))
  const vetoStr = vetoIdx < 0 ? undefined : _argv[vetoIdx].slice(_argv[vetoIdx].indexOf("=") + 1)
  const veto = !vetoStr ? undefined : new RegExp(vetoStr)

  const mkdocsIdx = _argv.findIndex((_) => new RegExp("^--mkdocs=").test(_))
  const mkdocs = mkdocsIdx < 0 ? undefined : _argv[mkdocsIdx].slice(_argv[mkdocsIdx].indexOf("=") + 1)

  const narrow = !!_argv.find((_) => _ === "--narrow" || _ === "-n")

  const noProfile = !!_argv.find((_) => _ === "--no-profile")
  const profilesPathIdx = _argv.findIndex((_) => _ === "--profiles-path")
  const profilesPath =
    profilesPathIdx < 0 ? undefined : _argv[profilesPathIdx].slice(_argv[profilesPathIdx].indexOf("=") + 1)

  // don't actually execute anything, but making choices and
  // validation and expanding lists is ok
  const dryRun = !!_argv.find((_) => _ === "--dry-run")

  const noOptimize = !!_argv.find((_) => _ === "-O0" || _ === "--optimize=0" || _ === "--no-optimize")
  const noAprioris = !!_argv.find((_) => _ === "--no-aprioris")
  const noValidate = !!_argv.find((_) => _ === "--no-validate")
  const verbose = !!_argv.find((_) => _ === "--verbose" || _ === "-V")
  const optimize = noOptimize ? false : { aprioris: !noAprioris, validate: !noValidate }

  // base uri of guidebook store; this will allow users to type
  // shortnames for books in the store
  const store = _argv.find((_) => _.startsWith("--store="))
    ? _argv.find((_) => _.startsWith("--store=")).replace(/^--store=/, "")
    : undefined

  const commandLineOptions: MadWizardOptions = { veto, dryRun, mkdocs, narrow, optimize, profilesPath, store, verbose }
  const options: MadWizardOptions = Object.assign(commandLineOptions, providedOptions)

  if (!task || !input) {
    return usage(argv)
  }

  if (!isValidTask(task)) {
    return usage(argv, `Invalid task: ${task}`)
  }

  if (isDebugTask(task)) {
    enableTracing(task)
  }

  // restore choices from profile
  const profile = options.profile
  const suggestions = noProfile
    ? newChoiceState()
    : await import("../../util/cache.js").then((_) => _.restoreChoices(options, profile))

  // if we are doing a run, then use the suggestions as the final
  // choices; otherwise, treat them just as suggestions in the guide
  const choices = task === "run" ? suggestions : newChoiceState()

  // A handler to serialize choices. We will call this after every
  // choice. At exit, make sure to wait for the last persist to finish.
  let lastPersist: ReturnType<typeof setTimeout>
  let lastPersistPromise: Promise<void>
  const persistChoices = () =>
    import("../../util/cache.js").then((_) => _.persistChoices(options, choices, suggestions, profile))
  if (!noProfile) {
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
    await inliner(input, argv[3], argv[4], options)
    return
  } else if (task === "mirror") {
    const { mirror } = await import("../../parser/markdown/snippets/mirror.js")
    await mirror(input, argv[3], undefined, options)
    return
  }

  const { blocks } = await parse(input, madwizardRead, choices, undefined, options)

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
      const Memoizer = await import("../../memoization/index.js").then((_) => _.Memoizer)
      const memos = new Memoizer()
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
      const Memoizer = await import("../../memoization/index.js").then((_) => _.Memoizer)
      ;(write || process.stdout.write.bind(process.stdout))(
        await vetoesToString(blocks, choices, new Memoizer(), options)
      )
      break
    }

    case "json": {
      const Memoizer = await import("../../memoization/index.js").then((_) => _.Memoizer)
      const memos = new Memoizer()
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
      const [Guide, Memoizer] = await Promise.all([
        import("../guide/index.js").then((_) => _.Guide),
        import("../../memoization/index.js").then((_) => _.Memoizer),
      ])

      const memoizer = new Memoizer(suggestions)

      /** Kill any spawned subprocesses */
      const cleanExit = memoizer.cleanup.bind(memoizer)
      process.on("SIGINT", cleanExit) // catch ctrl-c
      process.on("SIGTERM", cleanExit) // catch kill

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

        cleanExit()
      }
      break
    }

    default:
      // if our switch isn't exhaustive, you will see this typescript error:
      // Argument of type 'string' is not assignable to parameter of type 'never'.
      assertExhaustive(task)
  }
}
