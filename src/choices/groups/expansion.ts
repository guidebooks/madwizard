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

/** TODO allow a ValidationExecutor to be passed in */

import chalk from "chalk"
import { v4 } from "uuid"
import { oraPromise } from "../../util/ora-delayed-promise"

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
  shellExec,
} from "../../graph"

function updateContent<Part extends { graph: Graph; description?: string }>(part: Part, choice = ""): Part {
  const pattern1 = /\$\{?choice\}?/gi
  const pattern2 = /\$\{?uuid\}?/gi

  let _uuid: string
  const uuid = () => _uuid || (_uuid = v4())
  const replace = (str: string) => str.replace(pattern1, choice).replace(pattern2, uuid())

  blocks(part.graph).forEach((_) => {
    if (typeof _.body === "string") {
      _.body = replace(_.body)
    }

    if (typeof _.validate === "string") {
      _.validate = replace(_.validate)
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
function expandTemplate(template: ChoicePart, names: string[]) {
  return names.map((name, idx) => updatePart(JSON.parse(JSON.stringify(template)), name, idx))
}

export async function expand(graph: Graph) {
  if (isSequence(graph)) {
    await Promise.all(graph.sequence.map(expand))
  } else if (isParallel(graph)) {
    await Promise.all(graph.parallel.map(expand))
  } else if (isChoice(graph)) {
    if (isExpansionGroup(graph)) {
      graph.choices = (
        await Promise.all(
          graph.choices.map(async (part) => {
            const expansionExpr = isExpansion(part)
            if (!expansionExpr) {
              return updateContent(part)
            } else {
              const opts = { capture: "", throwErrors: true }
              try {
                await oraPromise(shellExec(expansionExpr, opts), chalk.dim(`Expanding ${chalk.blue(expansionExpr)}`))
                // debug("expansion/response", opts.capture)
                const response = opts.capture.split(/\n/).filter(Boolean)
                return expandTemplate(part, response)
              } catch (err) {
                // then the expansion failed. make sure the users don't
                // see the template
                return []
              }
            }
          })
        )
      ).flat()
    } else {
      graph.choices = graph.choices.map((_) => updateContent(_))
    }

    await Promise.all(graph.choices.map((_) => expand(_.graph)))
  } else if (isSubTask(graph)) {
    await expand(graph.graph)
  } else if (isTitledSteps(graph)) {
    await Promise.all(graph.steps.map((_) => expand(_.graph)))
  } else {
    updateContent({ graph })
  }

  return graph
}
