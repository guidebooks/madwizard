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
import which from "which"

import mock from "./mock.js"
import debug from "./debug.js"
import { ChoiceState } from "../../index.js"
import { getTabTitle, isTabWithProperties, setTabGroup, setTabTitle } from "../index.js"

export class Homebrew {
  /** the value should be namespaced and unique, but the particulars don't matter */
  public readonly choiceGroup = mock("madwizard/apriori/mac-installer")

  /** this helps with processing and optimizing based on the existence of homebrew on the user's system */
  private readonly canonicalName = "Homebrew"

  /** tabs whose title matches this pattern will be treated as being a Homebrew choice */
  private readonly RE_HOMEBREW = /(home)?brew/i

  /**
   * This code assumes the given `node` satisfies `import('..').isTabGroup`.
   *
   * @return whether or not this tab group represents a MacOS installation choice that includes Homebrew
   */
  private isMatchingTabGroup(node: Element) {
    return node.children
      .filter(isTabWithProperties)
      .map(getTabTitle)
      .find((title) => this.RE_HOMEBREW.test(title))
  }

  private rewriteTabsToUseCanonicalNames(node: Element) {
    node.children.forEach((tab) => {
      if (isTabWithProperties(tab)) {
        const title = getTabTitle(tab)
        if (this.RE_HOMEBREW.test(title) && title !== this.canonicalName) {
          setTabTitle(tab, this.canonicalName)
        }
      }
    })
  }

  /** Check to see if we have homebrew installed */
  public populateChoice(choices: ChoiceState) {
    // which('brew').then(() => choices.set(this.choiceGroup, this.canonicalName))
    // .catch(err => debug('Homebrew probably not found', err))
    try {
      if (which.sync("brew")) {
        const choice = this.canonicalName
        debug("homebrew", "using choice " + choice)
        choices.set(this.choiceGroup, choice, false)
      }
    } catch (err) {
      debug("homebrew", "probably not installed", err)
    }
  }

  /** Check if the given `node` is a tab group that we can inform */
  public checkAndSet(node: Element) {
    if (this.isMatchingTabGroup(node)) {
      debug("homebrew", "found matching tab group")
      setTabGroup(node, this.choiceGroup.group)
      this.rewriteTabsToUseCanonicalNames(node)
      return true
    }
  }
}

export default new Homebrew()
