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

import { test } from "uvu"
import * as assert from "uvu/assert"

import stripAnsi from "strip-ansi"
import { dirname, join } from "path"
import { diffString } from "json-diff"
import { createRequire } from "module"
import { readdirSync, readFileSync } from "fs"

import { cli, main } from "../.."

const require = createRequire(import.meta.url)
const inputDir = join(dirname(require.resolve(".")), "../inputs")

function munge(wizard: Awaited<ReturnType<typeof main>>["wizard"]) {
  return JSON.parse(
    JSON.stringify(wizard, (key, value) => {
      if (key === "group" || key === "id" || key === "key" || key === "filepath") {
        return "fakeit"
      } else if (key === "source" || (key === "content" && typeof value === "string")) {
        return value.replace(/(id): [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-\d+)?/g, "$1: fakeid")
      } else {
        return value
      }
    })
  )
}

function loadExpected(input: string, file: "wizard" | "tree") {
  const ext = file === "wizard" ? ".json" : ".txt"

  try {
    return readFileSync(join(input, file + ext)).toString()
  } catch (err) {
    const originalErr = err
    try {
      // in case we have platform-specific expected wizard
      return readFileSync(join(input, `${file}-${process.platform}${ext}`)).toString()
    } catch (err) {
      throw originalErr
    }
  }
}

function tryParseInt(str: string): number {
  try {
    return parseInt(str, 10)
  } catch (err) {
    return NaN
  }
}

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
    test(`tree for input ${input}`, async () => {
      let actualTree = ""
      const write = (msg: string) => {
        actualTree += msg
        return true
      }

      await cli(["test", "tree", join(input, "in.md")], write)
      const expectedTree = loadExpected(input, "tree")
      assert.equal(stripAnsi(actualTree.trim()), stripAnsi(expectedTree.trim()), "tree should match")
    })

    test(`wizards for input ${input}`, async () => {
      const { wizard } = await main(join(input, "in.md"))
      const expectedWizard = JSON.parse(loadExpected(input, "wizard"))
      const diff = diffString(munge(wizard), munge(expectedWizard), { color: false })
      assert.is(diff, "", "wizard should match")
    })
  })

test.run()
