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
import Debug from "debug"
import { oraPromise } from "../util/ora-delayed-promise.js"

import { hasProvenance } from "./provenance.js"
import { findChoiceFrontier } from "./choice-frontier.js"

import {
  CompileOptions,
  Choice,
  Graph,
  Ordered,
  Unordered,
  doValidate,
  extractTitle,
  isSequence,
  isParallel,
  isChoice,
  isTitledSteps,
  isSubTask,
  isValidatable,
} from "./index.js"

/**
 * Execute the `validate` property of the steps in the given `wizard`,
 * and stash the result in the `status` field of each step.
 */
async function collapseValidated<T extends Unordered | Ordered = Unordered, G extends Graph<T> = Graph<T>>(
  graph: G,
  options?: CompileOptions,
  firstChoice?: Choice,
  nearestEnclosingTitle?: string
): Promise<G> {
  if (options && options.veto && hasProvenance(graph) && graph.provenance.find((_) => options.veto.test(_))) {
    Debug("madwizard/graph/optimize/collapse-validated")("veto", extractTitle(graph))
    // then this optimization has been vetoed
    return graph
  }

  if (isValidatable(graph)) {
    const key: string = graph.validate.toString()
    if (graph.validate === true) {
      return undefined
    } else if (typeof graph.validate === "string") {
      if (options.statusMemo && options.statusMemo[key] && options.statusMemo[key] === "success") {
        // this Validatable has been previously validated in this
        // session (as indicated by its presence in the given
        // `statusMemo`
        return undefined
      } else {
        // otherwise, attempt to validate this Validatable
        const status = await oraPromise(
          doValidate(graph.validate, options),
          chalk.dim(`Validating ${chalk.blue(nearestEnclosingTitle || key)}`)
        )
        if (options.statusMemo) {
          // great, now memoize the result
          options.statusMemo[key] = status
        }
        if (status === "success") {
          return undefined
        }
      }
    }
  }

  const recurse = <T extends Unordered | Ordered, G extends Graph<T>>(graph: G) =>
    collapseValidated(graph, options, firstChoice, extractTitle(graph) || nearestEnclosingTitle)

  const recurse2 = <T extends Unordered | Ordered, G extends Graph<T>>({ graph }: { graph: G }) => recurse(graph)

  if (isSequence<T>(graph)) {
    const sequence = await Promise.all(graph.sequence.map(recurse)).then((_) => _.filter(Boolean))
    if (sequence.length > 0) {
      return Object.assign({}, graph, { sequence })
    }
  } else if (isParallel<T>(graph)) {
    const parallel = await Promise.all(graph.parallel.map(recurse)).then((_) => _.filter(Boolean))
    if (parallel.length > 0) {
      return Object.assign({}, graph, { parallel })
    }
  } else if (isTitledSteps<T>(graph)) {
    const steps = await Promise.all(graph.steps.map(recurse2))
    if (steps.filter(Boolean).length > 0) {
      return Object.assign({}, graph, {
        steps: graph.steps
          .map((_, idx) => {
            if (steps[idx]) {
              return Object.assign({}, _, { graph: steps[idx] })
            }
            return _
          })
          .filter(Boolean),
      })
    }
  } else if (isSubTask<T>(graph) && !isChoice(graph.graph)) {
    const subgraph = await recurse(graph.graph)
    if (subgraph) {
      return Object.assign({}, graph, { graph: subgraph })
    }
  } else if (isChoice<T>(graph) && graph.choices.length === 1) {
    const parts = await Promise.all(graph.choices.map(recurse2))
    if (parts.filter(Boolean).length > 0) {
      return Object.assign({}, graph, {
        choices: graph.choices
          .map((_, idx) => {
            if (parts[idx]) {
              return Object.assign({}, _, { graph: parts[idx] })
            }
            return _
          })
          .filter(Boolean),
      })
    }
  } else {
    return graph
  }
}

export default function collapse<T extends Unordered | Ordered = Unordered, G extends Graph<T> = Graph<T>>(
  graph: G,
  options?: CompileOptions
): G | Promise<G> {
  if (
    options &&
    options.optimize &&
    (options.optimize === false || (options.optimize !== true && options.optimize.validate === false))
  ) {
    // then this optimization has been disabled
    return graph
  }

  // otherwise: keep track of the first choice; there is no sense in
  // invoking potentially expensive validation logic beyond that; 1)
  // might be wasted work; 2) may not even be meaningful, as the
  // choice might alter state in a way that affects the way those
  // contingent validation tasks behave
  const frontier = findChoiceFrontier(graph)
  const firstChoice = frontier.length === 0 ? undefined : frontier[0].choice

  // then, traverse the graph, looking for validation opportunities
  return collapseValidated(graph, options, firstChoice)
}
