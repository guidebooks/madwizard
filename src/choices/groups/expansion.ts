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

import chalk from "chalk"
import { v4 } from "uuid"
import { oraPromise } from "../../util/ora-delayed-promise.js"

import { Debug } from "./debug.js"
import { ChoiceState } from "../index.js"
import { Memos } from "../../memoization/index.js"
import { ExecutorOptions } from "../../exec/Executor.js"
import { Graph, Choice, ChoicePart, blocks, findChoicesOnFrontier } from "../../graph/index.js"

/** Map from `ExpansionExpression.expr` to a list of expanded choices */
export type ExpansionMap = Record<string, Promise<string[]>>

export function updateContent<Part extends { graph: Graph; description?: string }>(part: Part, choice = ""): Part {
  const pattern1 = /\$\{?choice\}?/gi
  const pattern2 = /\$\{?uuid\}?/gi

  let _uuid: string
  const uuid = () => _uuid || (_uuid = v4())
  const replace = (str: string) => (choice ? str.replace(pattern1, choice) : str).replace(pattern2, uuid())

  blocks(part.graph).forEach((_) => {
    if (typeof _.body === "string") {
      _.body = replace(_.body)
    }

    if (typeof _.validate === "string") {
      _.validate = replace(_.validate)
    }

    if (typeof _.exec === "string") {
      _.exec = replace(_.exec)
    }
  })

  if (typeof part.description === "string") {
    part.description = replace(part.description)
  }

  return part
}

function updatePart(part: ChoicePart, choice: string, member = 0) {
  part.title = choice
  part.member = member
  return updateContent(part, choice)
}

/** @return the pattern we use to denote a dynamic expansion expression */
function expansionPattern() {
  return /expand\((.+)\)/
}

/** @return the pattern we use to denote a dynamic expansion expression with a message to print while expanding */
function expansionPatternWithMessage() {
  return /^\s*expand\((.+)\s*(,\s*(.+))\)\s*$/
}

/** Does the given Choice (i.e. a tab group) include a dynamic expansion? */
function isExpansionGroup(graph: Choice) {
  return expansionPattern().test(graph.group)
}

type ExpansionExpression = { expr: string; message?: string }

/** Is the given Choice member (i.e. a tab) a dynamic expansion? */
function isExpansion(part: ChoicePart): ExpansionExpression {
  const match = part.title.match(expansionPatternWithMessage()) || part.title.match(expansionPattern())
  if (match) {
    return {
      expr: match[1],
      message: match[3],
    }
  }
}

/** Replace any expansion parts with their dynamic expansion */
function expandPart(template: ChoicePart, names: string[]): ChoicePart[] {
  return names.map((name, idx) =>
    updatePart(JSON.parse(JSON.stringify(template, (key, value) => (key === "nesting" ? undefined : value))), name, idx)
  )
}

/**
 * Do the actual expansion of the given `expansionExpr`.
 *
 * TODO allow a ValidationExecutor to be passed in.
 */
async function doExpand(
  expansionExpr: ExpansionExpression,
  memos: Memos,
  options: Partial<ExecutorOptions> & { debug: ReturnType<typeof Debug> }
): Promise<string[]> {
  try {
    const response = await oraPromise(
      (options.exec || (await import("../../exec/index.js").then((_) => _.shellExecToString)))(
        expansionExpr.expr,
        memos,
        options
      ),
      `Expanding ${chalk.blue(expansionExpr.message || expansionExpr.expr)}`
    )
    return response.split(/\n/).filter(Boolean)
  } catch (err) {
    options.debug(expansionExpr.expr, memos.env, err)
    return undefined
  }
}

/**
 * Visit the graph, expanding choice templates (via `expandPart`) and
 * updating content such as descriptions and code bodies (via
 * `updateContent`) as we go.
 */
async function expandOneChoice(
  memos: Memos,
  options: Partial<ExecutorOptions> & { debug: ReturnType<typeof Debug> },
  graph: Choice
) {
  if (isExpansionGroup(graph)) {
    const newChoices = (
      await Promise.all(
        graph.choices.map(async (part) => {
          const expansionExpr = isExpansion(part)
          if (!expansionExpr) {
            return updateContent(part)
          } else {
            // is it memoized? we consider the answer no if the memo is []
            if (!memos.expansionMemo[expansionExpr.expr]) {
              memos.expansionMemo[expansionExpr.expr] = doExpand(expansionExpr, memos, options)
            }

            let response = await memos.expansionMemo[expansionExpr.expr]
            if (!response) {
              // then the previous expansion failed, try one more time
              options.debug(expansionExpr, "redo")
              memos.expansionMemo[expansionExpr.expr] = doExpand(expansionExpr, memos, options)
              response = await memos.expansionMemo[expansionExpr.expr]
            }

            options.debug(expansionExpr, response, memos.env)
            if (response && response.length > 0) {
              // expand the template, which yields Part -> Part[]
              return expandPart(part, response)
            }
          }
        })
      )
    )
      .flat()
      .filter(Boolean)

    if (newChoices.length > 0) {
      graph.choices = newChoices
    }
  } else {
    graph.choices = graph.choices.map((_) => updateContent(_))
  }
}

/**
 * Visit the graph, expanding choice templates (via `expandPart`) and
 * updating content such as descriptions and code bodies (via
 * `updateContent`) as we go.
 */
export async function expand(graph: Graph, choices: ChoiceState, memos: Memos) {
  // all "first choices" that haven't already been assigned a decision
  const choiceFrontier = findChoicesOnFrontier(graph, choices)

  if (choiceFrontier.length > 0) {
    await Promise.all(choiceFrontier.map(expandOneChoice.bind(undefined, memos, { debug: Debug("expansion") })))
  }

  // expand uuid macro
  blocks(graph).forEach((graph) => updateContent({ graph }))

  return graph
}
