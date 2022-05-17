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

import shellItOut from "./shell"
import { ExecOptions } from "./options"

/**
 * This is purely an optimization, since `pip show` is muy slow. The
 * goal is to check if a pip package is installed, without a lot of
 * fanfare.
 */
export default function execAsPythonPackageCheck(cmdline: string | boolean, opts: ExecOptions) {
  if (typeof cmdline === "string") {
    const match = cmdline.match(/^\s*pip-show\s+([^[]+)(\[(.+)\])?$/)
    if (match) {
      const packageName = `"${match[1]}"` + (match[3] ? `, "${match[3]}"` : "")
      const cmdline = `python3 -c 'import sys; import os; import site; sys.exit(0) if os.path.isdir(os.path.join(site.getsitepackages()[0], ${packageName})) or os.path.isfile(os.path.join(site.getsitepackages()[0], "${match[1]}.py")) or os.path.isdir(os.path.join(site.USER_SITE, ${packageName})) else sys.exit(1)'`
      return shellItOut(cmdline, opts)
    }
  }
}
