/*
 * Copyright 2023 The Kubernetes Authors
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

import { uriBuilder } from "./builder.js"
import { assembleOptions } from "../../options.js"
import { MadWizardOptions } from "../../../MadWizardOptions.js"

/** Fetch from the given `uri` as a string, but only if it is a URL */
async function fetchIfUrl(uri: string) {
  if (/^https?:\/\//.test(uri)) {
    const { toRawGithubUserContent } = await import("../../../../parser/markdown/snippets/urls.js")
    const { default: fetch } = await import("make-fetch-happen")
    const res = await fetch(toRawGithubUserContent(uri))
    const data = (await res.buffer()).toString()
    if (res.status !== 200) {
      throw new Error("Unable to fetch profile: " + data)
    } else {
      return data
    }
  }
}

/** Fetch the given `uri` as a string */
async function fetch(uri: string) {
  return (await fetchIfUrl(uri)) || import("fs/promises").then((_) => _.readFile(uri).then((_) => _.toString()))
}

/** madwizard import profile <profileUri> */
export default function importProfile(providedOptions: MadWizardOptions) {
  return {
    command: "import <uri>",
    describe: "Import a profile from a specified URI",
    builder: uriBuilder,
    handler: async (argv) => {
      const [{ default: exists }, { deserialize }, { save }] = await Promise.all([
        import("../../../../profiles/exists.js"),
        import("../../../../choices/index.js"),
        import("../../../../profiles/persist.js"),
      ])

      const opts = assembleOptions(providedOptions, argv)
      const data = await fetch(argv.uri)
      const choices = deserialize(data)

      if (argv.name) {
        choices.profile.name = argv.name
      }

      if (argv.force !== true && (await exists(opts, choices.profile.name))) {
        const { default: chalk } = await import("chalk")
        throw new Error(
          `${chalk.red("Error")}: profile ${choices.profile.name} already exists. Use ${chalk.yellow(
            "'-f/--force'"
          )} to overwrite, or ${chalk.yellow("-n/--name")} to use an alternate name.`
        )
      } else {
        await save(choices, opts)
      }
    },
  }
}
