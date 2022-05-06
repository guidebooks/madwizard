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

import { MadWizardOptions } from "../../"

import {
  Graph,
  StatusMemo,
  Ordered,
  Unordered,
  doValidate,
  isSequence,
  isParallel,
  isChoice,
  isTitledSteps,
  isSubTask,
  isValidatable,
  ValidateOptions,
} from "."

/*
interface OraLike {
  succeed(): void
  warn(): void
}

function emptyOra(): OraLike {
  return {
    succeed: () => {
      // noop
    },
    warn: () => {
      // noop
    },
  }
}
*/

/**
 * Execute the `validate` property of the steps in the given `wizard`,
 * and stash the result in the `status` field of each step.
 */
export default async function collapseValidated<
  T extends Unordered | Ordered = Unordered,
  G extends Graph<T> = Graph<T>
>(graph: G, options?: Pick<MadWizardOptions, "optimize"> & ValidateOptions & Partial<StatusMemo>): Promise<G> {
  /* const spinners = wizard.map(
      ({ step }, idx) =>
        new Promise<OraLike>((resolve) => {
          if (alreadyDone[idx] < 0) {
            setTimeout(() => {
              if (alreadyDone[idx] < 0) {
                resolve(ora(chalk.dim(`Validating ${chalk.blue(step.name)}`)).start())
              } else {
                resolve(emptyOra())
              }
            }, 500)
          } else {
            resolve(emptyOra())
          }
        })
        ) */
  if (
    options &&
    options.optimize &&
    (options.optimize === false || (options.optimize !== true && options.optimize.validate === false))
  ) {
    // then this optimization has been disabled
    return graph
  }

  if (isValidatable(graph)) {
    if (options.statusMemo && options.statusMemo[graph.key] === "success") {
      // this Validatable has been previously validated in this
      // session (as indicated by its presence in the given
      // `statusMemo`
      return undefined
    } else {
      // otherwise, attempt to validate this Validatable
      const status = await doValidate(graph.validate, options)
      if (options.statusMemo) {
        // great, now memoize the result
        options.statusMemo[graph.key] = status
      }
      if (status === "success") {
        return undefined
      }
    }
  }

  if (isSequence<T>(graph)) {
    graph.sequence = await Promise.all(graph.sequence.map((_) => collapseValidated(_, options))).then((_) =>
      _.filter(Boolean)
    )
    if (graph.sequence.length > 0) {
      return graph
    }
  } else if (isParallel<T>(graph)) {
    graph.parallel = await Promise.all(graph.parallel.map((_) => collapseValidated(_, options))).then((_) =>
      _.filter(Boolean)
    )
    if (graph.parallel.length > 0) {
      return graph
    }
  } else if (isChoice<T>(graph)) {
    const parts = await Promise.all(graph.choices.map((_) => collapseValidated(_.graph, options))).then((_) =>
      _.filter(Boolean)
    )
    if (parts.length === graph.choices.length) {
      // we haven't eliminated any choices...
      return graph
    }
  } else if (isTitledSteps<T>(graph)) {
    const steps = await Promise.all(graph.steps.map((_) => collapseValidated(_.graph, options))).then((_) =>
      _.filter(Boolean)
    )
    if (steps.length > 0) {
      graph.steps.forEach((_, idx) => (_.graph = steps[idx]))
      return graph
    }
  } else if (isSubTask<T>(graph)) {
    graph.graph = await collapseValidated(graph.graph, options)
    if (graph.graph) {
      return graph
    }
  } else {
    return graph
  }

  /*return Promise.all(
      wizard.map(async ({ step, graph }, idx) => {
        if (alreadyDone[idx] >= 0) {
          // probably no need to re-compute status
          const { status } = previous[alreadyDone[idx]]
          return { step, graph, status }
        }

        const spinner = spinners[idx]
        try {
          const status = await validate(graph, { validator })

          if (status === "success") {
            (await spinner).succeed()
          } else {
            (await spinner).warn()
          }

          return { step, graph, status }
        } catch (err) {
          (await spinner).warn()
          return { step, graph, status: "blank" as const }
        } finally {
          // the value here doesn't matter, as long as it is > 0; to
          // indicate to the delayed spinners that there's no need...
          alreadyDone[idx] = 1
        }
      })
    )

  return graph*/
}
