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

import shellItOut from "./shell.js"
import { Memos } from "../memoization/index.js"

/**
 * This is purely an optimization, since `pip show` is muy slow. The
 * goal is to check if a pip package is installed, without a lot of
 * fanfare.
 */
export default function execAsPythonPackageCheck(cmdline: string | boolean, memos: Memos) {
  if (typeof cmdline === "string") {
    const match = cmdline.match(/^\s*pip-show\s+([^[]+)(\[(.+)\])?$/)
    if (match) {
      // pip-show packageName[subpackage]
      //             \- match[1]   \- match[3]
      const packageName = `"${match[1]}"` + (match[3] ? `, "${match[3]}"` : "")

      // here, we look in the site packages directory for either a
      // directory or a file of that name; then we look in USER_SITE
      const imports = "import sys; import os; import site"
      const isDirInSitePackages = `os.path.isdir(os.path.join(site.getsitepackages()[0], ${packageName}))`
      const isFileInSitePackages = `os.path.isfile(os.path.join(site.getsitepackages()[0], "${match[1]}.py"))`
      const isDirInUserSite = `os.path.isdir(os.path.join(site.USER_SITE, ${packageName}))`
      const isFileInUserSite = `os.path.isfile(os.path.join(site.USER_SITE, ${match[1]}.py))`

      const cmdline = `python3 -c '${imports}; sys.exit(0) if ${isDirInSitePackages} or ${isFileInSitePackages} or ${isDirInUserSite} or ${isFileInUserSite} else sys.exit(1)'`

      if (memos.dependencies) {
        if (!memos.dependencies.pip) {
          memos.dependencies.pip = []
        }
        memos.dependencies.pip.push(match[1])
      }

      return shellItOut(cmdline, memos)
    }
  }
}
