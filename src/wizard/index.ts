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

import { ChoiceState } from "../choices"
import { findChoiceFrontier } from "../graph/choice-frontier"
import { Graph, Choice, bodySource, extractDescription, extractTitle, hasSource, isLeafNode } from "../graph"

type Markdown = string

export interface Tile {
  title: string
  group: string
  member: number
  description: string
}

type StepContent = Tile[] | Markdown

export interface WizardStep<C extends StepContent> {
  name: string
  description: string
  content: C
}

type WizardStepWithGraph<G extends Graph = Graph, C extends StepContent = StepContent> = {
  graph: G
  step: WizardStep<C>
}

export function isChoiceStep(step: WizardStepWithGraph): step is WizardStepWithGraph<Choice, Tile[]> {
  return Array.isArray(step.step.content)
}

export function isMarkdownStep(step: WizardStepWithGraph): step is WizardStepWithGraph<Graph, Markdown> {
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
      content: hasSource(graph) ? graph.source : isLeafNode(graph) ? bodySource(graph) : "",
    },
  }
}

/**
 * @return a `WizardStep` for a choice on the choice frontier
 */
function wizardStepForChoiceOnFrontier(graph: Choice, isFirstChoice: boolean): WizardStepWithGraph<Choice, Tile[]> {
  if (graph) {
    return {
      graph,
      step: {
        name: graph.title,
        description: "This step requires you to choose how to proceed",
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
}

type Wizard = WizardStepWithGraph[]
export { Wizard }

export function wizardify(dag: Graph, choices: ChoiceState): Wizard {
  const frontier = findChoiceFrontier(dag, choices)

  // the steps will be the interleaved ((...prereqs, choice), ...)
  // dictated by the this.state.frontier model, which comes from
  // choice-frontier.ts; the flatMap just says we want to flatten
  // this nested interleaving down to a linear set of WizardSteps
  const idxOfFirstChoice = frontier.findIndex((_) => _.choice)

  return findChoiceFrontier(dag, choices).flatMap(({ prereqs, choice }, idx): WizardStepWithGraph[] =>
    [
      ...prereqs.map((_) => wizardStepForPrereq(_)),
      wizardStepForChoiceOnFrontier(choice, idx === idxOfFirstChoice),
    ].filter(Boolean)
  )
}
