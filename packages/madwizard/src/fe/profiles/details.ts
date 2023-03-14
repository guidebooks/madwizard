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
import prettyMs from "pretty-ms"
import { Profile } from "../../profiles/Profile.js"

export default async function profileDetails(profile: Profile) {
  const { dump } = await import("js-yaml")

  const model = {
    name: profile.name,
    created: prettyMs(Date.now() - profile.creationTime, { compact: true }) + " ago",
    lastModified: prettyMs(Date.now() - profile.lastModifiedTime, { compact: true }) + " ago",
    choices: JSON.parse(
      JSON.stringify(profile.choices, (key, value) => {
        if (/_/.test(key) || /madwizard/.test(key)) {
          // don't show madwizard-internal "choices"
          return undefined
        } else if (/secret|key|credential|token/i.test(key) && !/image-pull/i.test(key)) {
          // obscure secrets
          return "******"
        } else {
          try {
            return JSON.parse(value)
          } catch (err) {
            // it's ok, this is just a non-json value (is there a better
            // way to detect this?)
            return value
          }
        }
      })
    ),
  }
  return dump(model).replace(/^(\s*)([^:]+)(:.*)$/gm, (_, whitespace, key, rest) => {
    const keyColor = !whitespace ? "blue" : whitespace.length === 2 ? "yellow" : "magenta"
    return whitespace + chalk[keyColor](key) + rest
  })
}
