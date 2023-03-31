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

import Debug from "debug"
import { Element } from "hast"
import { Parent } from "unist"
import { u } from "unist-builder"
import { Transformer } from "unified"
import { toString } from "hast-util-to-string"
import { visitParents } from "unist-util-visit-parents"

import { MadWizardOptions } from "../../../fe/index.js"
import { canonicalProvenanceOf, provenanceOfFilepath } from "../../../graph/provenance.js"

import dump from "./dump.js"
import { isTab } from "../rehype-tabbed/index.js"
import { isExecutable } from "../../../codeblock/isCodeBlock.js"
import { getTipTitle, isTipWithFullTitle } from "../rehype-tip/index.js"
import isElementWithProperties, {
  hasContentChildren,
  isElement,
  isInlineContent,
  isParagraph,
  isText,
  isNonEmptyTextOrParagraph,
} from "../util/isElement.js"
import { toMarkdownString, Node } from "../util/toMarkdownString.js"

import {
  isHeading,
  isHeadingOrRemovedHeading,
  isWizard,
  isWizardStep,
  getWizardGroup,
  getWizardStepMember,
  getTitle,
  getDescription,
  getHeadingLevel,
} from "../rehype-wizard.js"

import { tryFrontmatter } from "../frontmatter/index.js"
import {
  isBarrier,
  isFinallyFor,
  isOnAnImportChain,
  isImports,
  getImportGroup,
  getImportKey,
  getImportFilepath,
  getImportTitle,
  getValidate,
} from "../remark-import.js"
import { CodeBlockProps, addNesting as addCodeBlockNesting, Choice } from "../../../codeblock/CodeBlockProps.js"

/**
 * Heuristic: Code Blocks inside of closed "tips" (i.e. default-closed
 * expandable sections) are optional in terms of ultimate success of
 * the enclosing guidebook */
function isImplicitlyOptional(_: Parent): _ is Element {
  return isElementWithProperties(_) && _.tagName === "tip" && _.properties.open === false
}

/** @return the first child, if it is a paragraph  */
function extractFirstParagraph(parent: Parent, after?: Node) {
  const startIdx = !after ? 0 : parent.children.findIndex((_) => _ === after) + 1
  const pIdx = parent.children.findIndex((_, idx) => idx >= startIdx && isNonEmptyTextOrParagraph(_))
  if (pIdx >= 0) {
    const firstChild = parent.children[pIdx]
    if (firstChild) {
      if (isText(firstChild)) {
        // we need to accumulate children up until we see a newline
        const accum = []
        let iter = pIdx - 1
        while (++iter < parent.children.length) {
          const child = parent.children[iter]
          if (!isInlineContent(child) || (iter > pIdx && isText(child) && /^\n/.test(child.value))) {
            // found a prefix newline, or some non-inline content
            // (e.g. <pre> has implicit linebreak surrounds); note
            // that we do not include the pre (or whatever) in the
            // accum, since the newline is at the start
            break
          } else {
            accum.push(toMarkdownString(child))
            if (isText(child) && /\n$/.test(child.value)) {
              // found a trailing newline! include the content here
              break
            }
          }
        }

        // then rejoin them. for some reason, toMarkdownString adds
        // newlines to the end of links that aren't there in its own
        // model, and neither are they in the original
        // source. sigh. so we hack them out here.
        return accum.map((_) => _.replace(/\n$/, "")).join("")
      } else if (isParagraph(firstChild)) {
        return toMarkdownString(firstChild)
      }
    }
  }

  const pIdx2 = parent.children.findIndex(
    (_, idx) => idx >= startIdx && isElementWithProperties(_) && isImports(_.properties)
  )
  if (pIdx2 >= 0) {
    const firstChild = parent.children[pIdx2]
    if (isElementWithProperties(firstChild) && isImports(firstChild.properties)) {
      const para = extractFirstParagraph(firstChild)
      return para
    }
  }

  /*const firstChild = parent.children[startIdx]
  if (after) return firstChild && isElementWithProperties(firstChild) && firstChild.tagName
  if (firstChild && isElementWithProperties(firstChild) && firstChild.tagName === "p") {
    return toMarkdownString(firstChild)
  }*/
}

/**
 * Scan backwards from `parent` in `grandparent`'s children for a
 * heading. If found, return that heading's string form, and collect
 * all of the source between that heading and the given `parent`,
 * inclusive.
 */
function findNearestEnclosingTitle(grandparent: Parent, parent: Node, node: Node, desiredHeadingLevel?: number) {
  const parentIdx = !grandparent ? -1 : grandparent.children.findIndex((child) => child === parent)

  if (grandparent && parentIdx >= 0 && hasContentChildren(grandparent)) {
    for (let idx = parentIdx - 1; idx >= 0; idx--) {
      const child = grandparent.children[idx]
      if (isHeadingOrRemovedHeading(child) || (isTipWithFullTitle(child) && child.children.find((_) => _ === node))) {
        const level = getHeadingLevel(child)
        if (desiredHeadingLevel === undefined || (!isNaN(level) && level === desiredHeadingLevel)) {
          return {
            child,
            level,
            source: u("element", { tagName: "div" }, grandparent.children.slice(idx, parentIdx + 1)),
            title: isHeading(child) ? toString(child) : isTipWithFullTitle(child) ? getTipTitle(child) : "",
          }
        }
      }
    }
  }

  return {
    source: parent,
  }
}

/**
 * This rehype plugin adds a unique codeIdx ordinal property to each
 * executable code block.
 *
 * @param uuid an identifier for this document
 * @param filepath the origin filepath of this document
 * @param codeblocks in case the caller wants us to smash in the codeblocks we find
 */
export function rehypeCodeIndexer(
  uuid: string,
  filepath: string,
  options: MadWizardOptions,
  codeblocks?: CodeBlockProps[],
  base64 = false
) {
  const transformer: Transformer<Element> = (ast /*: Root */) => {
    const timing = Debug("madwizard/timing/parser:markdown/rehype-code-indexer")
    const debug = Debug("madwizard/graph/parser:markdown/rehype-code-indexer")
    timing("start")

    try {
      let codeIdx = 0
      const allocCodeBlockId = (myCodeIdx: number) => `${uuid}-${myCodeIdx}`

      visitParents(/* <Element> */ ast, "element", function visitor(node, ancestors) {
        if (isElement(node) && node.tagName === "code") {
          // react-markdown v6+ places the language in the className
          const match = node.properties.className
            ? /language-({\.)?(\w+)(\.async)?(\.stdin)?/.exec(node.properties.className.toString())
            : ""
          const language = match ? match[2] : undefined
          const async = match && match[3] ? true : undefined
          const stdin = match && match[4] ? true : undefined
          // re: {. bit: this is a bit of a hack to support {.bash .no-copy} style languages from pymdown
          // re: .async bit: allow markdown to specify that a code block's execution should be executed asynchronously
          // re: .stdin bit: allow markdown to specify that a code block's execution should be attached to stdin

          if (isExecutable(language)) {
            const myCodeIdx = codeIdx++
            node.properties.codeIdx = myCodeIdx

            if (node.children.length === 1 && node.children[0].type === "text") {
              // the AST node that houses this code block's string content
              const codeValueElement = node.children[0]

              const code = String(codeValueElement.value).trim()
              const { body, attributes } = tryFrontmatter(code)

              if (typeof attributes === "object") {
                if (!attributes.id) {
                  // assign a codeBlockId if the author did not specify one
                  attributes.id = allocCodeBlockId(myCodeIdx)
                }

                const dumpCodeBlockProps = !base64
                  ? () => Object.assign({ body, language, async, stdin }, attributes)
                  : () =>
                      Buffer.from(
                        JSON.stringify(Object.assign({ body, language, async, stdin }, attributes), (key, value) =>
                          key === "nesting" || key === "source" ? undefined : value
                        )
                      ).toString("base64")

                let codeBlockProps = dumpCodeBlockProps()

                const reserialize = () => {
                  // re-serialize this update for later use
                  codeBlockProps = dumpCodeBlockProps()
                  codeValueElement.value = dump(attributes, body)
                }

                const addNesting = (...params: Parameters<typeof addCodeBlockNesting>) => {
                  addCodeBlockNesting(...params)
                  reserialize()
                }

                if (attributes.validate === "$body") {
                  attributes.validate = body
                  reserialize()
                }

                // look for a directly enclosing heading to name the code block
                const parent = ancestors[ancestors.length - 1]
                const grandparent = ancestors[ancestors.length - 2]
                if (parent && grandparent) {
                  const { child, title, source } = findNearestEnclosingTitle(grandparent, parent, node)
                  if (title) {
                    // found one!
                    addNesting(attributes, {
                      kind: "Import",
                      source,
                      key: title,
                      title,
                      description: extractFirstParagraph(grandparent, child),
                      filepath: "",
                    })
                  }
                }

                // go from top to bottom, which is in reverse order, so
                // that we can synthesize the "optional" and "choices"
                // attributes
                for (let idx = ancestors.length - 1; idx >= 0; idx--) {
                  const _ = ancestors[idx]

                  if (attributes.optional !== true && isImplicitlyOptional(_)) {
                    // don't propagate code blocks out of either
                    // explicitly or implicitly optional elements. Re:
                    // implicitly, the idea is that we should stop
                    // propagating the code block upwards if we reach
                    // some element that seems indicative of blocking
                    // out an optional area, e.g. an expandable section
                    // that is default-closed
                    attributes.optional = true
                    reserialize()
                  }

                  if (isElementWithProperties(_)) {
                    if (isTab(_)) {
                      if (!attributes.choice || !attributes.choice.group) {
                        // get the choice group id from the parent (which encloses the tabs... in this group)
                        const parent = ancestors[idx - 1]
                        if (isElementWithProperties(parent)) {
                          // title for this choice
                          const title = _.properties.title.toString()

                          // identifier for this choice's group of choices
                          const group = parent.properties["data-kui-choice-group"].toString()

                          // identifier for this member of that group
                          const member = parseInt(_.properties["data-kui-tab-index"].toString(), 0)
                          // const nestingDepth = parseInt(parent.properties['data-kui-choice-nesting-depth'].toString(), 0)

                          const grandparent = ancestors[idx - 2]
                          const nesting: Choice = {
                            kind: "Choice",
                            source: _,
                            group,
                            title,
                            description: extractFirstParagraph(_),
                            member,
                            groupDetail: findNearestEnclosingTitle(grandparent, parent, node),
                          }

                          if (_.properties.formElementType && _.properties.formElementDefaultValue !== undefined) {
                            // we are part of a form
                            nesting.form = {
                              type: _.properties.formElementType,
                              defaultValue: _.properties.formElementDefaultValue,
                            }
                          } else if (_.properties.multiselect === true) {
                            // we are part of a multi-select (i.e. checkbox rather than the default radiobutton)
                            nesting.multiselect = true
                          }

                          addNesting(attributes, nesting)
                        }
                      }
                    } else if (isWizardStep(_.properties)) {
                      const parent = ancestors[idx - 1]
                      if (parent && isElementWithProperties(parent) && isWizard(parent.properties)) {
                        addNesting(attributes, {
                          kind: "WizardStep",
                          source: _,
                          group: getWizardGroup(_.properties),
                          member: getWizardStepMember(_.properties),
                          title: getTitle(_.properties),
                          description: getDescription(_.properties),
                          wizard: {
                            source: parent,
                            title: getTitle(parent.properties),
                            description: parent.children[0] ? toMarkdownString(parent.children[0]) : undefined,
                          },
                        })
                      }
                    } else if (isImports(_.properties)) {
                      //const description = getDescription(_.properties)
                      const description = extractFirstParagraph(_)
                      addNesting(attributes, {
                        kind: "Import",
                        source: _,
                        barrier: isBarrier(_.properties),
                        isFinallyFor: isFinallyFor(_.properties),
                        key: getImportKey(_.properties),
                        title: getImportTitle(_.properties),
                        description,
                        filepath: getImportFilepath(_.properties),
                        validate: getValidate(_.properties),
                        group: getImportGroup(_.properties),
                      })
                    } else if (isTipWithFullTitle(_)) {
                      const title = getTipTitle(_)
                      addNesting(attributes, {
                        kind: "Import",
                        source: _,
                        key: title,
                        title,
                        filepath: "",
                      })
                    }
                  }
                }

                // we had to go from top to bottom, so reverse now
                if (attributes.nesting) {
                  attributes.nesting = attributes.nesting.reverse()
                  reserialize()

                  if (!isOnAnImportChain(ancestors)) {
                    // try looking for an outermost h1
                    const grandparent = ancestors[0]
                    if (grandparent) {
                      const parent = grandparent.children[grandparent.children.length - 1]
                      if (grandparent && parent) {
                        const { child, title, source } = findNearestEnclosingTitle(grandparent, parent, node, 1)
                        if (title) {
                          addNesting(
                            attributes,
                            {
                              kind: "Import",
                              source,
                              key: title,
                              title,
                              filepath: "",
                              provenance: canonicalProvenanceOf(provenanceOfFilepath(filepath), options),
                              description: extractFirstParagraph(grandparent, child),
                            },
                            0
                          )
                        }
                      }
                    }
                  }

                  if (debug.enabled) {
                    debug(
                      "nesting of " + body,
                      attributes.nesting.map(({ key, kind, title, source, group }) => ({
                        key,
                        kind,
                        title,
                        source,
                        group,
                      }))
                    )
                  }
                }

                // go from bottom to top stopping at the first import,
                // accumulating code blocks
                // let isOnImportChain = false
                for (let idx = ancestors.length - 1; idx >= 0; idx--) {
                  const _ = ancestors[idx]

                  if (isElementWithProperties(_)) {
                    if (Array.isArray(_.properties.containedCodeBlocks)) {
                      // satisify any element that has requested that
                      // we aggregate code blocks
                      _.properties.containedCodeBlocks.push(codeBlockProps)
                    }

                    if (isImports(_.properties)) {
                      // don't propagate containedCodeBlocks above the
                      // import declaration
                      // isOnImportChain = true
                      break
                    }
                  }
                }

                if (Array.isArray(codeblocks)) {
                  codeblocks.push(
                    !base64 ? codeBlockProps : JSON.parse(Buffer.from(codeBlockProps, "base64").toString())
                  )
                }
              }
            }
          }
        }
      })
    } finally {
      timing("complete")
    }
  }
  return transformer
}
