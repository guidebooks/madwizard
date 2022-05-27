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

import debug from "./debug.js"
import { ChoiceState } from "../../index.js"
import { getTabTitle, isTabWithProperties, setTabGroup, setTabTitle } from "../index.js"

export class RunningInTerminal {
  /** internal, the value should be namespaced and unique, but the particulars don't matter */
  public readonly choiceGroup = "madwizard/apriori/in-terminal"

  /**
   * This code assumes the given `node` satisfies `import('..').isTabGroup`.
   *
   * @return whether or not this tab group represents a "what platform are you on" choice group.
   */
  private isMatchingTabGroup(node: Element) {
    return node.children
      .filter(isTabWithProperties)
      .map(getTabTitle)
      .every((_) => /^text$/i.test(_) || /^html$/i.test(_))
  }

  private get text() {
    return "Text"
  }

  private get html() {
    return "HTML"
  }

  private canonicalize(str: string) {
    return /text/i.test(str) ? this.text : this.html
  }

  private rewriteTabsToUseCanonicalNames(node: Element) {
    node.children.forEach((tab) => {
      if (isTabWithProperties(tab)) {
        setTabTitle(tab, this.canonicalize(getTabTitle(tab)))
      }
    })
  }

  private inTerminal() {
    return typeof window === "undefined" ? this.text : this.html
  }

  /** Set the platform choice group to use the current host platform */
  public populateChoice(choices: ChoiceState) {
    const choice = this.inTerminal()
    debug("interminal", "using choice " + choice)
    choices.set(this.choiceGroup, choice, false)
  }

  /** Check if the given `node` is a tab group that we can inform */
  public checkAndSet(node: Element) {
    if (this.isMatchingTabGroup(node)) {
      debug("interminal", "found matching tab group")
      setTabGroup(node, this.choiceGroup)
      this.rewriteTabsToUseCanonicalNames(node)
      return true
    }
  }
}

export default new RunningInTerminal()
