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

import ora from "ora"
import chalk from "chalk"
import Debug from "debug"

import {
  Graph,
  Choice,
  Status,
  ValidationExecutor,
  bodySource,
  extractDescription,
  extractTitle,
  hasSource,
  isOptional,
  isLeafNode,
  findChoiceFrontierWithFallbacks,
  sameGraph,
  validate,
} from "../graph"

type Markdown = string

export interface Tile {
  title: string
  group: string
  member: number
  description?: string
}

type StepContent = Tile[] | Markdown

export interface WizardStep<C extends StepContent> {
  name: string
  description?: string
  introduction?: string
  content: C
}

type WizardStepWithGraph<G extends Graph = Graph, C extends StepContent = StepContent> = {
  /**
   * If we were given a `ValidationExecutor`, we will keep the
   * validation status of the step here
   */
  status: Status

  /** The wizard model for this step */
  step: WizardStep<C>

  /**
   * The underlying graph model that was used to generate the `step`
   * model.
   */
  graph: G
}

export type TaskStep = WizardStepWithGraph<Graph, Markdown>
export type ChoiceStep = WizardStepWithGraph<Choice, Tile[]>

export function isChoiceStep(step: WizardStepWithGraph): step is ChoiceStep {
  return Array.isArray(step.step.content)
}

export function isTaskStep(step: WizardStepWithGraph): step is TaskStep {
  return !isChoiceStep(step)
}

/**
 * @return a `WizardStep` for a non-choice prereq for a choice on the
 * choice frontier
 */
function wizardStepForPrereq<G extends Graph>(graph: G): WizardStepWithGraph<G, Markdown> {
  return {
    graph,
    status: "blank",
    step: {
      name: extractTitle(graph),
      description: extractDescription(graph),
      content: hasSource(graph) ? graph.source() : isLeafNode(graph) ? bodySource(graph) : "",
    },
  }
}

/**
 * @return a `WizardStep` for a choice on the choice frontier
 */
function wizardStepForChoiceOnFrontier(graph: Choice, isFirstChoice: boolean): WizardStepWithGraph<Choice, Tile[]> {
  return {
    graph,
    status: "blank",
    step: {
      name: graph.title,
      description: "This step requires you to choose how to proceed",
      // TODO: introduction: graph.description,
      content: graph.choices.map((_) => ({
        title: _.title,
        group: graph.group,
        member: _.member,
        isFirstChoice,
        description: _.description,
      })),
    },
  }
}

type Wizard = WizardStepWithGraph[]
export { Wizard }

/** Options to the graph->wizard transformer */
type Options = {
  /** Include optional blocks in the wizard? */
  includeOptional: boolean

  /**
   * If given, tasks in the wizard will be validated, and incomplete
   * tasks will be returned as part of the `Wizard` model.
   */
  validator: ValidationExecutor

  /**
   * In order to avoid re-checking validity, callers may pass in the
   * prior Wizard model.
   */
  previous: Wizard
}

export async function wizardify(
  graph: Graph,
  { includeOptional, validator, previous }: Partial<Options> = {}
): Promise<Wizard> {
  const debug = Debug("madwizard/timing/wizard:wizardify")
  debug("start")

  try {
    const frontier = findChoiceFrontierWithFallbacks(graph)

    // the steps will be the interleaved ((...prereqs, choice), ...)
    // dictated by the this.state.frontier model, which comes from
    // choice-frontier.ts; the flatMap just says we want to flatten
    // this nested interleaving down to a linear set of WizardSteps
    const idxOfFirstChoice = frontier.findIndex((_) => _.choice)

    const wizard = frontier.flatMap(({ prereqs, choice }, idx) => [
      ...(!prereqs ? [] : prereqs.filter((_) => includeOptional || !isOptional(_)).map((_) => wizardStepForPrereq(_))),
      ...(!choice || (!includeOptional && isOptional(choice))
        ? []
        : [wizardStepForChoiceOnFrontier(choice, idx === idxOfFirstChoice)]),
    ])

    if (validator) {
      // then update the Wizard model with real Status fields.
      const alreadyDone = wizard.map(({ graph }) => {
        return previous ? previous.findIndex((_) => sameGraph(graph, _.graph)) : -1
      })

      const spinners = wizard.map(({ step }, idx) => {
        if (alreadyDone[idx] < 0) {
          return ora(chalk.dim(`Validating ${chalk.blue(step.name)}`)).start()
        }
      })

      return Promise.all(
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
              spinner.succeed()
            } else {
              spinner.warn()
            }

            return { step, graph, status }
          } catch (err) {
            spinner.warn()
            return { step, graph, status: "blank" }
          }
        })
      )
    } else {
      return wizard
    }
  } finally {
    debug("complete")
  }
}
