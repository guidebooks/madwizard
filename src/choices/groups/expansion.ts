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
import { ExecutorOptions } from "../../exec/Executor.js"
import { Memos } from "../../memoization/index.js"
import {
  Graph,
  Choice,
  ChoicePart,
  blocks,
  isSequence,
  isParallel,
  isChoice,
  isTitledSteps,
  isSubTask,
} from "../../graph/index.js"

export type ExpansionMap = Record<ReturnType<typeof isExpansion>, string[]>

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

/** Does the given Choice (i.e. a tab group) include a dynamic expansion? */
function isExpansionGroup(graph: Choice) {
  const match = graph.group.match(expansionPattern())
  return match && match[1]
}

/** Is the given Choice member (i.e. a tab) a dynamic expansion? */
function isExpansion(part: ChoicePart) {
  const match = part.title.match(expansionPattern())
  return match && match[1]
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
async function doExpand(expansionExpr: string, options: Partial<ExecutorOptions>): Promise<string[]> {
  try {
    const response = await oraPromise(
      (options.exec || (await import("../../exec/index.js").then((_) => _.shellExecToString)))(expansionExpr, options),
      chalk.dim(`Expanding ${chalk.blue(expansionExpr)}`)
    )
    return response.split(/\n/).filter(Boolean)
  } catch (err) {
    // then the expansion failed. make sure the users don't
    // see the template
    return []
  }
}

/**
 * Visit the graph, expanding choice templates (via `expandPart`) and
 * updating content such as descriptions and code bodies (via
 * `updateContent`) as we go.
 */
async function visit(
  graph: Graph,
  options: Partial<Memos> & Partial<ExecutorOptions> & { debug: ReturnType<typeof Debug> }
) {
  const recurse = (graph: Graph) => visit(graph, options)

  if (isSequence(graph)) {
    return Promise.all(graph.sequence.map(recurse))
  } else if (isParallel(graph)) {
    return Promise.all(graph.parallel.map(recurse))
  } else if (isChoice(graph)) {
    if (isExpansionGroup(graph)) {
      const newChoices = (
        await Promise.all(
          graph.choices.map(async (part) => {
            const expansionExpr = isExpansion(part)
            if (!expansionExpr) {
              return updateContent(part)
            } else {
              const response =
                (options.expansionMemo && options.expansionMemo[expansionExpr]) ||
                (await doExpand(expansionExpr, options))
              options.debug(expansionExpr, response)

              if (response.length > 0) {
                // memoize the expansion
                if (options.expansionMemo) {
                  options.expansionMemo[expansionExpr] = response
                }

                // expand the template, which yields Part -> Part[]
                const parts = expandPart(part, response)

                // recurse on the expanded parts
                await Promise.all(parts.map((_) => recurse(_.graph)))
                return parts
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
      return Promise.all(graph.choices.map((_) => recurse(_.graph)))
    }
  } else if (isSubTask(graph)) {
    return recurse(graph.graph)
  } else if (isTitledSteps(graph)) {
    return Promise.all(graph.steps.map((_) => recurse(_.graph)))
  } else {
    updateContent({ graph })
  }
}

/**
 * Visit the graph, expanding choice templates (via `expandPart`) and
 * updating content such as descriptions and code bodies (via
 * `updateContent`) as we go.
 */
export async function expand(graph: Graph, options: Partial<Memos> = {}) {
  const debug = Debug("expansion")
  await visit(graph, Object.assign({ debug }, options))
  return graph
}
