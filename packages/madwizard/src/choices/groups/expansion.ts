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
import { join } from "path"
import { oraPromise } from "../../util/ora-delayed-promise.js"

import { Debug } from "./debug.js"
import { ChoiceState } from "../index.js"
import { Memos } from "../../memoization/index.js"
import { ExecutorOptions } from "../../exec/Executor.js"
import { Graph, Choice, ChoicePart, blocks, findChoicesOnFrontier } from "../../graph/index.js"

/** Map from `ExpansionExpression.expr` to a list of expanded choices */
export type ExpansionMap = Record<string, Promise<string[] | null>>

function expandHomeDir(path: string) {
  const homedir = process.env.HOME_FOR_TEST || process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"]

  if (!path) return path
  if (path == "~") return homedir
  if (path.slice(0, 2) != "~/") return path
  return join(homedir, path.slice(2))
}

export function updateContent<Part extends { graph: Graph; description?: string }>(part: Part, choice = ""): Part {
  const pattern1 = /\$\{?choice\}?/gi
  const pattern2a = /\${uuid}/gi
  const pattern2b = /\$uuid/gi

  let _uuid: string
  const uuid = () => _uuid || (_uuid = v4())
  const replace = (str: string) =>
    (choice ? str.replace(pattern1, typeof choice === "string" ? expandHomeDir(choice) : choice) : str)
      .replace(pattern2a, uuid())
      .replace(pattern2b, uuid())

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
  return /^\s*expand\((.+)\s*,\s*([\w\s]+)\s*\)\s*$/
}

/** @return the pattern we use to denote a dynamic expansion expression with a message to print while expanding, and a memoization key */
function expansionPatternWithMessageAndKey() {
  return /^\s*expand\((.+)\s*,\s*([\w\s]+)\s*,\s*([\w\s]+)\s*\)\s*$/
}

/** Does the given Choice (i.e. a tab group) include a dynamic expansion? */
function isExpansionGroup(graph: Choice) {
  return expansionPattern().test(graph.group)
}

type ExpansionExpression = { expr: string; message?: string; key?: string }

/** Is the given Choice member (i.e. a tab) a dynamic expansion? */
function isExpansion(part: ChoicePart): ExpansionExpression {
  const match =
    part.title.match(expansionPatternWithMessageAndKey()) ||
    part.title.match(expansionPatternWithMessage()) ||
    part.title.match(expansionPattern())
  if (match) {
    return {
      expr: match[1],
      message: match[2],
      key: match[3],
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
): Promise<string[] | null> {
  try {
    const response = await oraPromise(
      (options.exec || (await import("../../exec/index.js").then((_) => _.shellExecToString)))(
        expansionExpr.expr,
        memos,
        options
      ),
      chalk.dim(`Expanding ${chalk.blue(expansionExpr.message || expansionExpr.expr)}`)
    )

    // we treat the response as a newline-separated list of names
    return response.split(/\n/).filter(Boolean)
  } catch (err) {
    options.debug(expansionExpr.expr, memos.env, err)
    return null // <-- we use a `null` entry in the memo to indicate a failed expansion
  }
}

/**
 * Expand the given `expansionExpr` of the given `part`. For example,
 * we may be asked to expand a list of files, and the `expansionExpr`
 * is the bash script that will return this list.
 *
 * We memoize the expansion. The assumption here is that, for a given
 * `madwizard` session, the resulting list will not change.
 *
 */
async function getOrExpand(
  choice: Choice,
  part: ChoicePart,
  expansionExpr: ExpansionExpression,
  memos: Memos,
  options: Partial<ExecutorOptions> & { debug: ReturnType<typeof Debug> },
  inRetry = false
) {
  // First, check if this expansion is memoized.
  const memoKey = expansionExpr.expr

  if (expansionExpr.key && memos.env[expansionExpr.key]) {
    // then the guide has specified that the expansion should be given
    // by the environment variable `expansionExpr.key`
    const value = memos.env[expansionExpr.key]
    memos.expansionMemo[memoKey] = Promise.resolve([value])
    memos.suggestions.set(choice, value)
  } else if (!memos.expansionMemo[memoKey]) {
    // not yet, call `doExpand()` to do the actual expansion work
    memos.expansionMemo[memoKey] = doExpand(expansionExpr, memos, options)
  } else {
    // then we may have a memoized result; first, we will need to
    // check whether it is `null`, indicating a failed expansion in
    // the past
    options.debug(expansionExpr, "memoized")
  }

  const myMemo = memos.expansionMemo[memoKey]
  const response = await myMemo // <-- the memoized response

  if (response === null) {
    // we use `null` (as opposed to absence of the key in the memo) to
    // indicate that the prior expansion failed; see `doExpand()` above.
    if (inRetry) {
      // then the retry also failed; give up :(
      options.debug(expansionExpr, "inval")
      delete memos.expansionMemo[memoKey]
    } else {
      // then the previous expansion failed, try one more time
      options.debug(expansionExpr, "redo")
      if (memos.expansionMemo[memoKey] === myMemo) {
        options.debug(expansionExpr, "redo-inval")
        delete memos.expansionMemo[memoKey]
      }
      return getOrExpand(choice, part, expansionExpr, memos, options, true) // initiate retry
    }
  }

  options.debug(expansionExpr, response, memos.env)
  if (response && response.length > 0) {
    // expand the template, which yields Part -> Part[]
    return expandPart(part, response)
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
            return getOrExpand(graph, part, expansionExpr, memos, options)
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