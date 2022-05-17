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

import { ExecOptions } from "./options"

/** See if we are being asked to execute `export FOO=bar` */
export default function execAsExport(cmdline: string | boolean, opts: ExecOptions) {
  if (opts.env && typeof cmdline === "string") {
    const match = cmdline.match(/^\s*export\s+(.+)="?([^"]+)"?$/)
    if (match) {
      const [, key, value] = match
      const valueForUpdate = value.replace(/\${?([^:]+)}?/g, (_, p1) => opts.env[p1] || process.env[p1])
      opts.env[key] = valueForUpdate
      return "success" as const
    }
  }
}
