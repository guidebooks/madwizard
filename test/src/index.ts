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

import { suite } from "uvu"
import * as assert from "uvu/assert"

import stripAnsi from "strip-ansi"
import { dirname, join } from "path"
import { diffString } from "json-diff"
import { createRequire } from "module"
import { readdirSync, readFileSync } from "fs"

import { cli, MadWizardOptions } from "../.."

const require = createRequire(import.meta.url)
const inputDir = join(dirname(require.resolve(".")), "../inputs")

const options: { suffix: string; options: MadWizardOptions }[] = [
  { suffix: "", options: {} },
  { suffix: "noaprioris", options: { optimize: { aprioris: false } } },
  { suffix: "noopt", options: { optimize: false } },
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
      } else if (key === "source" || (key === "content" && typeof value === "string")) {
        return value.replace(/(id): [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-\d+)?/g, "$1: fakeid")
      } else {
        return value
      }
    })
  )
}

function loadExpected(input: string, task: "wizard" | "tree", suffix: string) {
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

const tasks = ["plan", "wizard"]
const suites = options.flatMap(({ suffix }) => tasks.map((task) => suite(`${task} ${suffix || "default options"}`)))
/**
 * Assumption: test inputs are numbered directories. All other
 * directories are ignored.
 */
readdirSync(inputDir)
  .map(tryParseInt)
  .filter((_) => !isNaN(_))
  .sort((a, b) => a - b)
  .map((_) => join(inputDir, String(_)))
  .forEach((input) => {
    options.forEach(({ suffix, options }, idx) => {
      const test1 = suites[idx * tasks.length]
      test1(`tree for input ${input} options=${suffix || "default"}`, async () => {
        let actualTree = ""
        const write = (msg: string) => {
          actualTree += msg
          return true
        }

        await cli(["test", "plan", join(input, "in.md")], write, options)
        const expectedTree = loadExpected(input, "tree", suffix)
        assert.equal(stripAnsi(actualTree.trim()), stripAnsi(expectedTree.trim()), "tree should match")
      })

      const test2 = suites[idx * tasks.length + 1]
      test2(`wizards for input ${input} options=${suffix || "default"}`, async () => {
        let actualWizard = ""
        const write = (msg: string) => {
          actualWizard += msg
          return true
        }

        await cli(["test", "json", join(input, "in.md")], write, options)
        const expectedWizard = JSON.parse(loadExpected(input, "wizard", suffix))
        const diff = diffString(munge(JSON.parse(actualWizard)), munge(expectedWizard), { color: false })
        assert.is(diff, "", "wizard should match")
      })
    })
  })

suites.forEach((suite) => suite.run())
