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
  graph: G
  step: WizardStep<C>
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
}

export async function wizardify(graph: Graph, { includeOptional, validator }: Partial<Options> = {}): Promise<Wizard> {
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
      // then filter out tasks that are already done
      const debug = Debug("madwizard/wizard/validator")

      const spinners = wizard.map(({ step }) => ora(`Validating ${chalk.blue(step.name)}`).start())

      const statuses: Status[] = await Promise.all(
        wizard.map(async ({ graph }, idx) => {
          const spinner = spinners[idx]
          try {
            const status = await validate(graph, { validator })
            spinner.succeed()
            return status
          } catch (err) {
            spinner.warn()
            return "blank"
          }
        })
      )

      debug("wizard step validation", statuses)
      return wizard.filter((_, idx) => statuses[idx] !== "success")
    }

    return wizard
  } finally {
    debug("complete")
  }
}
