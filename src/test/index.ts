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

import slash from "slash"
import { suite, Test } from "uvu"
import * as assert from "uvu/assert"
import { execFile } from "child_process"

import stripAnsi from "strip-ansi"
import { dirname, join } from "path"
import { diffString } from "json-diff"
import { createRequire } from "module"
import { readdirSync, readFileSync } from "fs"

import { CLI, MadWizardOptions } from "../index.js"

const require = createRequire(import.meta.url)
const inputDir = join(dirname(require.resolve(".")), "../../test/inputs")

type Options = MadWizardOptions | ((input: string) => MadWizardOptions)

const options: { suffix: string; options: Options }[] = [
  { suffix: "", options: {} },
  { suffix: "noaprioris", options: { optimize: { aprioris: false } } },
  { suffix: "noopt", options: { optimize: false } },
  {
    suffix: "veto",
    options: (input: string) => {
      try {
        return {
          veto: new RegExp(readFileSync(join(input, "veto.txt")).toString().trim()),
        }
      } catch (err) {
        if (err.code === "ENOENT") {
          return null
        } else {
          throw err
        }
      }
    },
  },
]

function munge(wizard: Record<string, unknown>) {
  return JSON.parse(
    JSON.stringify(wizard, (key, value) => {
      if (key === "group" || key === "id" || key === "key" || key === "filepath") {
        return "fakeit"
      } else if (key === "source" || key === "position") {
        return "placeholder"
      } else if (key === "description" && !value) {
        return undefined
      } else if (key === "provenance") {
        return value.map((_) => slash(_))
      } else if (key === "source" || (key === "content" && typeof value === "string")) {
        return value
          .replace(/(id): [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-\d+)?/g, "$1: fakeid")
          .replace(/\r/g, "")
      } else if (typeof value === "string") {
        return value.replace(/\r/g, "")
      } else {
        return value
      }
    })
  )
}

function loadExpected(input: string, task: "wizard" | "tree" | "run", suffix: string) {
  const ext = task === "wizard" ? ".json" : ".txt"

  let originalErr: Error
  try {
    return readFileSync(join(input, task + (suffix ? `-${suffix}` : "") + ext)).toString()
  } catch (err) {
    originalErr = err
    try {
      return readFileSync(join(input, task + ext)).toString()
    } catch (err) {
      originalErr = err
    }
  }

  try {
    // in case we have platform-specific expected wizard
    return readFileSync(join(input, `${task}-${process.platform}${ext}`)).toString()
  } catch (err) {
    throw originalErr
  }
}

function tryParseInt(str: string): number {
  try {
    return parseInt(str, 10)
  } catch (err) {
    return NaN
  }
}

/** Read the cli.txt file, treated as extra command line args */
function getCLIOptions(input: string) {
  const baseOptions = ["--verbose"]

  try {
    const asserts = readFileSync(join(input, "assert.txt")).toString()
    if (asserts.length > 0) {
      return baseOptions.concat(
        asserts
          .split(/\n/)
          .filter(Boolean)
          .map((_) => `--assert=${_}`)
      )
    }
  } catch (err) {
    // fall-through
  }
  return baseOptions
}

/** "madwizard plan" */
function testPlanTask(test: Test, input: string, suffix: string, _options: Options) {
  test(`tree for input ${input} options=${suffix || "default"}`, async () => {
    let actualOutput = ""
    const write = (msg: string) => {
      actualOutput += msg
      return true
    }

    const filepath = join(input, "in.md")
    const options = typeof _options === "function" ? _options(input) : _options

    if (typeof _options === "function" && options === null) {
      // then there are no tests to run for this variant, e.g. no
      // veto.txt file for this input
      return
    }

    await CLI.cli(["test", "plan", filepath, ...getCLIOptions(input)], write, options)
    const expectedOutput = loadExpected(input, "tree", suffix)
    assert.equal(stripAnsi(actualOutput.trim()), stripAnsi(expectedOutput.trim()), "tree should match")
  })
}

/** "madwizard json" */
function testJsonTask(test: Test, input: string, suffix: string, _options: Options) {
  test(`wizards for input ${input} options=${suffix || "default"}`, async () => {
    let actualOutput = ""
    const write = (msg: string) => {
      actualOutput += msg
      return true
    }

    const filepath = join(input, "in.md")
    const options = typeof _options === "function" ? _options(input) : _options

    await CLI.cli(["test", "json", filepath, ...getCLIOptions(input)], write, options)
    const expectedOutput = JSON.parse(loadExpected(input, "wizard", suffix))
    const diff = diffString(munge(JSON.parse(actualOutput)), munge(expectedOutput), { color: false })
    assert.is(diff, "", "wizard should match")
  })
}

/** "madwizard run" */
function testRunTask(test: Test, input: string, suffix: string) {
  test(`run for input ${input} options=${suffix || "default"}`, async () => {
    const filepath = join(input, "in.md")
    const expectedOutput = loadExpected(input, "run", suffix)

    if (suffix.length > 0) {
      // since we aren't passing any of the options to the subprocess,
      // then there's no point in executing variants
      return
    }

    // why use a subprocess spawn here? if we want to call `cli()` as
    // a function, we'd need to update `validate.shellExec` to allow
    // capturing *those* subprocess outputs, so that we can validate
    // them... ugh, that seems like too much work, so instead we just
    // spawn a madwizard subprocess, and capture stdout here as
    // `actualOutput`. This is far slower than invoking `cli()`
    // directly, but there's only so many hours in a day...
    await new Promise<void>((resolve, reject) => {
      execFile("./bin/madwizard.js", ["run", filepath, ...getCLIOptions(input)], (err, actualOutput) => {
        try {
          assert.equal(
            stripAnsi(actualOutput.toString().trim()),
            stripAnsi(expectedOutput.trim()),
            "run output should match"
          )
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  })
}

const justTheseInputs =
  process.argv.length <= 2 ? undefined : new Set(process.argv.slice(2).map((_) => parseInt(_, 10)))

const tasks = ["plan", "wizard", "run"]
const suites = options.flatMap(({ suffix }) => tasks.map((task) => suite(`${task} ${suffix || "default options"}`)))
/**
 * Assumption: test inputs are numbered directories. All other
 * directories are ignored.
 */
readdirSync(inputDir)
  .map(tryParseInt)
  .filter((_) => !isNaN(_))
  .filter((_) => !justTheseInputs || justTheseInputs.has(_))
  .sort((a, b) => a - b)
  .map((_) => join(inputDir, String(_)))
  .forEach((input) => {
    options.forEach(({ suffix, options }, idx) => {
      testPlanTask(suites[idx * tasks.length], input, suffix, options)
      testJsonTask(suites[idx * tasks.length + 1], input, suffix, options)
      testRunTask(suites[idx * tasks.length + 2], input, suffix)
    })
  })

suites.forEach((suite) => suite.run())
