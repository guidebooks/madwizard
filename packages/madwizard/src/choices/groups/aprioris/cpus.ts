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

import { cpus } from "os"
import { Element } from "hast"

import mock from "./mock.js"
import debug from "./debug.js"
import { ChoiceState } from "../../index.js"
import { getTabTitle, isTabWithProperties, setTabGroup, setTabTitle } from "../index.js"

export class Cpus {
  /** internal, the value should be namespaced and unique, but the particulars don't matter */
  public readonly choiceGroup = mock("madwizard/apriori/cpus")

  private readonly cpus: Record<string, string> = {
    "number of cpus": "num_cpus",
    num_cpus: "num_cpus",
    ncpus: "num_cpus",

    "number of gpus": "num_gpus",
    num_gpus: "num_gpus",
    ngpus: "num_gpus",
  }

  private readonly findCpu = (str: string) => this.cpus[str.toLowerCase()]

  /**
   * This code assumes the given `node` satisfies `import('..').isTabGroup`.
   *
   * @return whether or not this tab group represents a "how many cpus" choice group.
   */
  private isMatchingTabGroup(node: Element) {
    return node.children.filter(isTabWithProperties).map(getTabTitle).every(this.findCpu)
  }

  private rewriteTabsToUseCanonicalNames(node: Element) {
    node.children.forEach((tab) => {
      if (isTabWithProperties(tab)) {
        setTabTitle(tab, this.findCpu(getTabTitle(tab)))
      }
    })
  }

  /** Set the choice group to use the current cpu config */
  public populateChoice(choices: ChoiceState) {
    const choice = JSON.stringify({ num_cpus: cpus().length, num_gpus: 0 })
    debug("cpus", "using choice " + choice)
    choices.set(this.choiceGroup, choice, false)
  }

  /** Check if the given `node` is a tab group that we can inform */
  public checkAndSet(node: Element) {
    if (this.isMatchingTabGroup(node)) {
      debug("cpus", "found matching tab group")
      setTabGroup(node, this.choiceGroup.group)
      this.rewriteTabsToUseCanonicalNames(node)
      return true
    }
  }
}

export default new Cpus()
