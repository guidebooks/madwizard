/*
 * Copyright 2021 The Kubernetes Authors
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

import Debug from "debug"
import { Transformer } from "unified"
import { Node, Element, ElementContent, Properties } from "hast"

import { ChoiceState } from "../../../choices/index.js"
import { MadWizardOptions } from "../../../fe/index.js"
import isElementWithProperties from "../util/isElement.js"
import { identifyRecognizableTabGroups } from "../../../choices/groups/index.js"
import { AllowedFormElement, FormElementType } from "../../../codeblock/index.js"

import populateTabs from "./populate.js"

export const START_OF_TAB = `<!-- ____KUI_START_OF_TAB____ -->`
export const PUSH_TABS = `<!-- ____KUI_NESTED_TABS____ -->`
export const END_OF_TAB = `<!-- ____KUI_END_OF_TAB____ -->`

export type TabProps<T extends AllowedFormElement = string> = Properties & {
  /** Is this tab part of a form group */
  formElementType?: FormElementType
  formElementDefaultValue?: T
}

export interface Tab extends Element {
  properties: TabProps
}

/** Properties of a tab group */
interface TabGroupProps {
  depth: string
  "data-kui-choice-group": string
  children: Tab[]
}

export function getTabsDepth(props: TabGroupProps) {
  return typeof props.depth === "number" ? props.depth : parseInt(props.depth.toString(), 10)
}

/*export function getTabTitle(child: TabGroupProps['children'][number]) {
  return (isElementWithProperties(child) && child.properties.title) || ''
}*/

export function isTabs(props: Partial<TabGroupProps>): props is Required<TabGroupProps> {
  return typeof props["data-kui-choice-group"] === "string"
}

export function isTab(elt: ElementContent): elt is Tab {
  return isElementWithProperties(elt) && elt.properties["data-kui-tab-index"] !== undefined
}

export function isTabWithProperties(elt: ElementContent): elt is Element {
  return isTab(elt)
}

export function isTabGroup(elt: Node | Element): elt is Element {
  return isElementWithProperties(elt) && elt.properties["data-kui-choice-group"] !== undefined
}

export function setTabGroup(elt: Element, group: string) {
  elt.properties["data-kui-choice-group"] = group
}

export function getTabTitle(elt: Element): string {
  return elt.properties.title.toString()
}

export function setTabTitle(elt: Element, title: string): string {
  return (elt.properties.title = title)
}

/* function setTabIndex(elt: Element, idx: number) {
  elt.properties["data-kui-tab-index"] = idx
} */

export function rehypeTabbed(uuid: string, choices: ChoiceState, madwizardOptions: MadWizardOptions) {
  return function rehypeTabbedTransformer(tree: Parameters<Transformer>[0]): ReturnType<Transformer> {
    const debug = Debug("madwizard/timing/parser:markdown/rehype-tabbed")
    debug("start")

    try {
      // first, assemble the tabs into this tree structure, one of these per tab group:
      // - div with properties {data-kui-choice-group, data-kui-choice-nesting-depth}
      //   - span with properties {data-kui-tab-index=0}
      //       children: content of first tab
      //   - span with properties {data-kui-tab-index=1}
      //       children: content of second tab
      //   - span with properties {data-kui-tab-index=2}
      //       children: content of third tab
      //
      const { tree: treeWithTabs, tabgroupIdx } = populateTabs(uuid, tree)

      // second, analyze the tabs to see if we can identify recognizable
      // tab groups, e.g. "choose your platform"
      const treeWithTabsInRecognizableGroups =
        tabgroupIdx < 0 ? treeWithTabs : identifyRecognizableTabGroups(treeWithTabs, choices, madwizardOptions)

      return treeWithTabsInRecognizableGroups
    } finally {
      debug("complete")
    }
  }
}
