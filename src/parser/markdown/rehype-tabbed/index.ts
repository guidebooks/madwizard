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
import { Element, ElementContent } from "hast"

import isElementWithProperties from "../util/isElement"
import { ChoiceState, MadWizardOptions } from "../../.."
import { identifyRecognizableTabGroups } from "../../../choices/groups"

import populateTabs from "./populate"

export const START_OF_TAB = `<!-- ____KUI_START_OF_TAB____ -->`
export const PUSH_TABS = `<!-- ____KUI_NESTED_TABS____ -->`
export const END_OF_TAB = `<!-- ____KUI_END_OF_TAB____ -->`

export interface TabProps {
  depth: string
  "data-kui-choice-group": string
  children: any
}

export function getTabsDepth(props: TabProps) {
  return typeof props.depth === "number" ? props.depth : parseInt(props.depth.toString(), 10)
}

/*export function getTabTitle(child: TabProps['children'][number]) {
  return (isElementWithProperties(child) && child.properties.title) || ''
}*/

export function isTabs(props: Partial<TabProps>): props is Required<TabProps> {
  return typeof props["data-kui-choice-group"] === "string"
}

export function isTab(elt: ElementContent): boolean {
  return isElementWithProperties(elt) && elt.properties["data-kui-tab-index"] !== undefined
}

export function isTabWithProperties(elt: ElementContent): elt is Element {
  return isTab(elt)
}

export function isTabGroup(elt: Element): boolean {
  return elt.properties["data-kui-choice-group"] !== undefined
}

export function isExpansionGroup(elt: Element): string {
  if (isTabGroup(elt)) {
    const match = elt.properties["data-kui-choice-group"].toString().match(/expand\((.+)\)/)
    return match && match[1]
  }
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

function setTabIndex(elt: Element, idx: number) {
  elt.properties["data-kui-tab-index"] = idx
}

export function cloneAndAddTab(elt: Element, template: Element, title: string, idx: number) {
  if (isTabGroup(elt) && isTabWithProperties(template)) {
    const tab = JSON.parse(JSON.stringify(template))
    setTabTitle(tab, title)
    setTabIndex(tab, idx)
    elt.children.push(tab)

    return tab
  }
}

export function rehypeTabbed(uuid: string, choices: ChoiceState, madwizardOptions: MadWizardOptions) {
  return async function rehypeTabbedTransformer(tree: Parameters<Transformer>[0]): Promise<ReturnType<Transformer>> {
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
        tabgroupIdx < 0 ? treeWithTabs : await identifyRecognizableTabGroups(treeWithTabs, choices, madwizardOptions)

      return treeWithTabsInRecognizableGroups
    } finally {
      debug("complete")
    }
  }
}
