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

import { dirname, join } from "path"
import { diffString } from "json-diff"
import { createRequire } from "module"
import { readdirSync, readFileSync } from "fs"

import madWizard from "../.."

const require = createRequire(import.meta.url)
const inputDir = join(dirname(require.resolve(".")), "../inputs")

function munge(wizard: Awaited<ReturnType<typeof madWizard>>["wizard"]) {
  return JSON.parse(
    JSON.stringify(wizard, (key, value) => {
      if (key === "group" || key === "id" || key === "key") {
        return "fakeid"
      } else if (key === "source") {
        return value.replace(/id: [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, "")
      } else {
        return value
      }
    })
  )
}

readdirSync(inputDir)
  .map((_) => join(inputDir, _))
  .forEach((input) =>
    test(input, async () => {
      const { wizard } = await madWizard(join(input, "in.md"))
      const expectedWizard = JSON.parse(readFileSync(join(input, "wizard.json")).toString())
      const diff = diffString(munge(wizard), munge(expectedWizard), { color: false })
      assert.is(diff, "", "wizard should match")
    })
  )

test.run()
