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

import { Choices, ChoiceState } from "../choices/index.js"
import { Memos, statusOf } from "../memoization/index.js"
import { toMarkdownString } from "../parser/markdown/util/toMarkdownString.js"
import { Barrier, FormElement, MultiSelectElement } from "../codeblock/index.js"

import {
  Graph,
  Choice,
  Status,
  bodySource,
  extractDescription,
  extractTitle,
  hasSource,
  isOptional,
  isLeafNode,
  isBarrier,
  findChoiceFrontier,
} from "../graph/index.js"
import {
  FinallySubTask,
  NormalSubTask,
  asNormalSubTask,
  isSubTask,
  isNormalSubTask,
  isFinallySubTask,
} from "../graph/nodes/SubTask.js"

type Markdown = string | (() => string)

export type Tile = Partial<FormElement> &
  Partial<MultiSelectElement> & {
    title: string
    group: string
    member: number
    description?: string
  }

type StepContent = Tile[] | Markdown

export function isForm(content: Tile[]) {
  return content.length > 0 && typeof content[0].form === "object"
}

export function isMultiSelect(content: Tile[]) {
  return content.length > 0 && content[0].multiselect
}

export type WizardStep<C extends StepContent> = Partial<Barrier> & {
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

export type TaskStep<G extends Graph = Graph> = WizardStepWithGraph<G, Markdown>
export type FinallyTaskStep = TaskStep<FinallySubTask>
export type ChoiceStep = WizardStepWithGraph<Choice, Tile[]>

export function isChoiceStep(step: WizardStepWithGraph): step is ChoiceStep {
  return Array.isArray(step.step.content)
}

export function isTaskStep(step: WizardStepWithGraph): step is TaskStep {
  return !isChoiceStep(step)
}

export function isNormalTaskStep(step: WizardStepWithGraph): step is FinallyTaskStep {
  return isTaskStep(step) && (!isSubTask(step.graph) || isNormalSubTask(step.graph))
}

export function isFinallyTaskStep(step: WizardStepWithGraph): step is FinallyTaskStep {
  return isTaskStep(step) && isFinallySubTask(step.graph)
}

export function asNormalTaskStep(finallyStep: FinallyTaskStep): TaskStep<NormalSubTask> {
  return Object.assign({}, finallyStep, { graph: asNormalSubTask(finallyStep.graph) })
}

/**
 * @return a `WizardStep` for a non-choice prereq for a choice on the
 * choice frontier
 */
function wizardStepForPrereq<T, G extends Graph<T>>(
  graph: G,
  memos: Memos,
  choices: ChoiceState
): WizardStepWithGraph<G, Markdown> {
  return {
    graph,
    status: (memos.statusMemo && statusOf(graph, memos.statusMemo, choices)) || "blank",
    step: {
      name: extractTitle(graph) || "Missing title",
      description: extractDescription(graph),
      barrier: isBarrier(graph),
      content: hasSource(graph) ? () => toMarkdownString(graph.source) : isLeafNode(graph) ? bodySource(graph) : "",
    },
  }
}

/**
 * @return a `WizardStep` for a choice on the choice frontier
 */
function wizardStepForChoiceOnFrontier(
  graph: Choice,
  isFirstChoice: boolean,
  memos: Memos,
  choices: ChoiceState
): WizardStepWithGraph<Choice, Tile[]> {
  const status = (memos.statusMemo && statusOf(graph, memos.statusMemo, choices)) || "blank"
  return {
    graph,
    status,
    step: {
      name: graph.title,
      description: graph.description, // "This step requires you to choose how to proceed",
      content: graph.choices.map((_) => ({
        title: _.title,
        group: graph.group,
        member: _.member,
        isFirstChoice,
        description: _.description,
        form: _.form,
        multiselect: _.multiselect,
      })),
    },
  }
}

type Wizard = WizardStepWithGraph[]
export { Wizard }

/** Options to the graph->wizard transformer */
type Options = Partial<Choices> & {
  /** Include optional blocks in the wizard? */
  includeOptional: boolean

  /**
   * In order to avoid re-checking validity, callers may pass in the
   * prior Wizard model.
   */
  previous: Wizard
}

export function wizardify<T>(graph: Graph<T>, memos: Memos, options: Partial<Options> = {}): Wizard {
  const debug = Debug("madwizard/timing/wizard:wizardify")
  debug("start")

  try {
    const frontier = findChoiceFrontier(graph)

    // the steps will be the interleaved ((...prereqs, choice), ...)
    // dictated by the this.state.frontier model, which comes from
    // choice-frontier.ts; the flatMap just says we want to flatten
    // this nested interleaving down to a linear set of WizardSteps
    const idxOfFirstChoice = frontier.findIndex((_) => _.choice)

    const { includeOptional } = options

    const wizard = frontier.flatMap(({ prereqs, choice, finallies }, idx) => [
      ...(!prereqs && !finallies
        ? []
        : (prereqs || [])
            .concat(finallies || [])
            .filter((_) => includeOptional || !isOptional(_))
            .map((_) => wizardStepForPrereq(_, memos, options.choices))),
      ...(!choice || (!includeOptional && isOptional(choice))
        ? []
        : [wizardStepForChoiceOnFrontier(choice, idx === idxOfFirstChoice, memos, options.choices)]),
    ])

    return wizard
  } finally {
    debug("complete")
  }
}
