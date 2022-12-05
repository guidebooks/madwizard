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

import which from "which"

/** See if we are being asked to execute `which somethingSomething` */
export default function execAsWhich(cmdline: string | boolean) {
  if (typeof cmdline === "string") {
    const match = cmdline.match(/^\s*which\s+([^$]\S*)$/)
    if (match) {
      return which(match[1]).then(() => "success" as const)
    }
  }
}
