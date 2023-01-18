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

import { Node, Parent } from "unist"
import { Element, ElementContent, Literal, Root, Text } from "hast"

type ElementWithTag<T extends string> = Element & { tagName: T }
type Pre = ElementWithTag<"pre">
type Anchor = ElementWithTag<"a">
type Strong = ElementWithTag<"strong">
type Em = ElementWithTag<"em">

export function isLiteral(node: Node): node is Literal {
  return typeof (node as Literal).value === "string"
}

export function isText(node: Node): node is Text {
  return (
    node.type === "text" &&
    typeof (node as Text).value === "string" &&
    !/imports:/.test((node as Text).value) &&
    !/^:+$/.test((node as Text).value)
  )
  // the latter two try to exclude import text from remark-import and snippets/index
}

export function isPre(node: Node): node is Pre {
  return isElementWithProperties(node) && node.tagName === "pre"
}

export function isAnchor(node): node is Anchor {
  return isElementWithProperties(node) && node.tagName === "a"
}

export function isStrong(node): node is Strong {
  return isElementWithProperties(node) && node.tagName === "strong"
}

export function isEm(node): node is Em {
  return isElementWithProperties(node) && node.tagName === "em"
}

/** Is this content without an implicit prefix line break? */
export function isInlineContent(node: Node): boolean {
  return isText(node) || isAnchor(node) || isStrong(node) || isEm(node)
}

export function isParagraph(node: Node): node is Element & { tagName: "p" } {
  return isElementWithProperties(node) && node.tagName === "p"
}

/** imports: is leftover from remark-import */
export function isNonEmptyTextOrParagraph(node: Node): node is Text | Element {
  return (isText(node) && !!node.value.trim()) || (isParagraph(node) && isText(node.children[0]))
}

export function isParent(node: Node): node is Parent {
  return Array.isArray((node as Parent).children)
}

export function isRoot(node: Node): node is Root {
  return (node as Root).type === "root"
}

export function isElement(_: Node | Parent | ElementContent): _ is Element {
  const elt = _ as Element
  return elt && typeof elt.tagName === "string"
}

export function hasContentChildren(node: Node): node is Element | Root {
  return isElement(node) || isRoot(node)
}

export default function isElementWithProperties(_: Element | ElementContent | Parent | Node): _ is Element {
  return isElement(_) && _.properties !== undefined
}
