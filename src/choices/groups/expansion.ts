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
import { visit } from "unist-util-visit"

import debug from "./debug"
import { isText } from "../../parser/markdown/util/isElement"
import { cloneAndAddTab, isExpansionGroup, isTabWithProperties, setTabTitle } from "../../parser/markdown/rehype-tabbed"

// TODO allow a ValidationExecutor to be passed in
import { shellExec } from "../../graph"

function updateTemplate(tab: Element, choice: string) {
  visit(tab, (node) => {
    if (isText(node)) {
      node.value = node.value.replace(/\$\{choice\}/gi, choice)
    }
  })
}

function rewriteTabsToIncludeExpansion(node: Element, names: string[]) {
  const firstTab = node.children[0]
  if (isTabWithProperties(firstTab)) {
    names.slice(1).forEach((name, idx) => {
      const tab = cloneAndAddTab(node, firstTab, name, idx + 1)
      if (tab) {
        updateTemplate(tab, name)
      }
    })

    setTabTitle(firstTab, names[0])
    updateTemplate(firstTab, names[0])
  }
}

export default async function expand(node: Element) {
  const expansionExpr = isExpansionGroup(node)
  if (expansionExpr) {
    debug("expansion/expr", expansionExpr)

    const opts = { capture: "" }
    try {
      await shellExec(expansionExpr, opts)
      debug("expansion/response", opts.capture)
      const response = opts.capture.split(/\n/).filter(Boolean)
      rewriteTabsToIncludeExpansion(node, response)
    } catch (err) {
      debug("expansion/error", err)
    }

    return true
  }
}
