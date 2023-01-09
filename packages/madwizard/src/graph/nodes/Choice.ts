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

import Graph from "../Graph.js"
import { Provenance } from "../provenance.js"
import { Ordered, Unordered } from "./Ordered.js"
import Sequence, { sameSequence } from "./Sequence.js"

import { ChoiceState } from "../../choices/index.js"
import { Description, FormElement, MultiSelectElement, Source, Title } from "../../codeblock/CodeBlockProps.js"

/** identifier of a choice/question, i.e. "choose A or B or C" */
type ChoiceGroup = string

/** identifier of an answer to a choice, i.e. "I chose B" */
type ChoiceMember = number

/** An answer to a choice */
export type ChoicePart<T extends Unordered | Ordered = Unordered> = Title &
  Partial<Description> &
  Partial<FormElement> &
  Partial<MultiSelectElement> & {
    member: ChoiceMember
    graph: Sequence<T>
  }

export function isPartOfForm(part: ChoicePart): part is ChoicePart & Required<FormElement> {
  return typeof part.form === "object"
}

/** An choice/question */
type Choice<T extends Unordered | Ordered = Unordered> = Source &
  T &
  Title &
  Description &
  Partial<Provenance> & {
    /** identifier for this choice */
    group: ChoiceGroup

    /** in case we are making the same choice more than once, an id for that context */
    groupContext: string

    /** The tuple of options for this choice */
    choices: ChoicePart<T>[]
  }

export type OrderedChoice = Choice<Ordered>

export function isChoice<T extends Unordered | Ordered = Unordered>(graph: Graph<T>): graph is Choice<T> {
  return graph && Array.isArray((graph as Choice).choices)
}

export function sameChoice(A: Choice, B: Choice) {
  return (
    A.group === B.group &&
    A.choices.length === B.choices.length &&
    A.choices.every((a, idx) => a.member === B.choices[idx].member && sameSequence(a.graph, B.choices[idx].graph))
  )
}

/* function sameChoices(A: ChoiceState, B: ChoiceState) {
  return JSON.stringify(A) === JSON.stringify(B)
} */

/**
 * @return the current choice index, which defaults to the first if we
 * are not provided a set of user choices via the `choices`
 * parameter. The decision to default to the first choice stems from a
 * common origin UI, of presenting choices in a set of tabs; in a
 * tabular UI, usually the first tab is open by default.
 */
export function chooseIndex(graph: Choice, choices: "default-path" | ChoiceState = "default-path") {
  const selectedTitle = choices !== "default-path" ? choices.get(graph) : undefined

  const index = !selectedTitle ? 0 : graph.choices.findIndex((_) => _.title === selectedTitle)
  return index < 0 ? 0 : index
}

/**
 * @return the current choice, which defaults to the first if we are
 * not provided a set of user choices via the `choices` parameter. The
 * decision to default to the first choice stems from a common origin
 * UI, of presenting choices in a set of tabs; in a tabular UI,
 * usually the first tab is open by default.
 */
export function choose<T extends Unordered | Ordered = Unordered>(
  graph: Choice<T>,
  choices: "default-path" | ChoiceState = "default-path"
): Graph<T> {
  return graph.choices[chooseIndex(graph, choices)].graph
}

export default Choice
