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

import { Element } from "hast"

import mock from "./mock.js"
import debug from "./debug.js"
import { ChoiceState } from "../../index.js"
import { getTabTitle, isTabWithProperties, setTabGroup, setTabTitle } from "../index.js"

export class Platform {
  /** internal, the value should be namespaced and unique, but the particulars don't matter */
  public readonly choiceGroup = mock("madwizard/apriori/platform")

  private readonly platforms: Record<string, typeof process["platform"]> = {
    mac: "darwin",
    macos: "darwin",
    darwin: "darwin",

    linux: "linux",

    win: "win32",
    win32: "win32",
    windows: "win32",

    wsl: "linux",
    wsl2: "linux",
    "windows subsystem for linux": "linux",
    "windows subsystem for linux 2": "linux",
  }

  private readonly findPlatform = (str: string) => this.platforms[str.toLowerCase()]

  /**
   * This code assumes the given `node` satisfies `import('..').isTabGroup`.
   *
   * @return whether or not this tab group represents a "what platform are you on" choice group.
   */
  private isMatchingTabGroup(node: Element) {
    return node.children.filter(isTabWithProperties).map(getTabTitle).every(this.findPlatform)
  }

  private capitalize(str: string) {
    return str[0].toUpperCase() + str.slice(1)
  }

  private rewriteTabsToUseCanonicalNames(node: Element) {
    node.children.forEach((tab) => {
      if (isTabWithProperties(tab)) {
        setTabTitle(tab, this.capitalize(this.findPlatform(getTabTitle(tab))))
      }
    })
  }

  /** Set the platform choice group to use the current host platform */
  public populateChoice(choices: ChoiceState) {
    const choice = process.platform
    debug("platform", "using choice " + choice)
    if (!choices.contains(this.choiceGroup)) {
      choices.set(this.choiceGroup, choice, false)
    }
  }

  /** Check if the given `node` is a tab group that we can inform */
  public checkAndSet(node: Element) {
    if (this.isMatchingTabGroup(node)) {
      debug("platform", "found matching tab group")
      setTabGroup(node, this.choiceGroup.group)
      this.rewriteTabsToUseCanonicalNames(node)
      return true
    }
  }
}

export default new Platform()
