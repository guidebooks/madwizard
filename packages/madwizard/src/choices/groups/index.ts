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

import { Node, Element } from "hast"
import { visit } from "unist-util-visit"

import { ChoiceState } from "../index.js"
import { MadWizardOptions } from "../../fe/index.js"
import { isTabGroup } from "../../parser/markdown/rehype-tabbed/index.js"
export {
  getTabTitle,
  isTabWithProperties,
  setTabGroup,
  setTabTitle,
} from "../../parser/markdown/rehype-tabbed/index.js"

import aprioris from "./aprioris/index.js"

export function populateAprioris(choices: ChoiceState, { optimize = true }: MadWizardOptions = {}) {
  const useAprioris = !(optimize === false || (optimize !== true && optimize.aprioris === false))

  if (useAprioris) {
    aprioris
      .filter((_) => !choices.contains(_.choiceGroup)) // already set?
      .forEach((_) => _.populateChoice(choices))
  }

  return useAprioris
}

/**
 * Scan tab groups to see if we can squash down the choice given our a
 * priori knowledge, e.g. about what platform we are on.
 *
 */
export function identifyRecognizableTabGroups(tree: Node, choices: ChoiceState, options: MadWizardOptions) {
  if (!choices) {
    return
  }

  const useAprioris = populateAprioris(choices, options)

  const nodesToVisit: Element[] = []

  visit(tree, "element", (node) => {
    if (isTabGroup(node)) {
      nodesToVisit.push(node)
    }
  })

  nodesToVisit.forEach((node) => {
    if (useAprioris) {
      // re: the use of `find`
      // Assumption: a given tab group can only have one match,
      // e.g. it is either a platform choice (macos/linux/windows)
      // or an download method choice (homebrew, curl)
      if (aprioris.find((_) => _.checkAndSet(node))) {
        return
      }
    }

    // if (await expand(node)) {
    // return
    // }
  })

  return tree
}
