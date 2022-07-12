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

import { MadWizardOptions } from "../MadWizardOptions.js"

export default async function profileSubcommand(argv: string[], options: MadWizardOptions) {
  const task = argv[2]

  if (task === "get") {
    const [ui, profiles] = await Promise.all([
      import("../profiles/table.js").then((_) => _.default),
      import("../../profiles/list.js").then((_) => _.default(options)),
    ])
    console.log(ui(profiles))
  } else if (task === "delete") {
    const profileName = argv[3]
    if (!profileName) {
      throw new Error("Usage: profile delete <profileName>")
    }
    await import("../../profiles/delete.js").then((_) => _.default(options, profileName))
  } else if (task === "clone") {
    const srcProfileName = argv[3]
    const destProfileName = argv[4]
    if (!srcProfileName || !destProfileName) {
      throw new Error("Usage: profile clone <srcProfileName> <destProfileName>")
    }

    await import("../../profiles/clone.js").then((_) => _.default(options, srcProfileName, destProfileName))
  }
}
