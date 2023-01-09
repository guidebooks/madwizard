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

import { Graph } from "./index.js"
import { Ordered, Unordered } from "./nodes/Ordered.js"
import SubTask, { isSubTask } from "./nodes/SubTask.js"
import Parallel, { isParallel } from "./nodes/Parallel.js"
import Choice, { ChoicePart, isChoice } from "./nodes/Choice.js"
import Sequence, { isSequence, emptySequence } from "./nodes/Sequence.js"
import TitledSteps, { TitledStep, isTitledSteps } from "./nodes/TitledSteps.js"

import { CodeBlockProps } from "../codeblock/index.js"

function orderSequence(graph: Sequence = emptySequence(), ordinal = 0): Sequence<Ordered> {
  const { postorder, sequence } = graph.sequence.reduce(
    (P: { postorder: number; sequence: Graph<Ordered>[] }, _) => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      const subgraph = order(_, P.postorder + 1)
      P.sequence.push(subgraph)
      return { postorder: subgraph.postorder, sequence: P.sequence }
    },
    { postorder: ordinal, sequence: [] }
  )

  return { key: graph.key, order: ordinal, postorder, sequence }
}

function orderParallel(graph: Parallel, ordinal: number): Parallel<Ordered> {
  const { postorder, parallel } = graph.parallel.reduce(
    (P: { postorder: number; parallel: Graph<Ordered>[] }, _) => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      const subgraph = order(_, P.postorder + 1)
      P.parallel.push(subgraph)
      return { postorder: subgraph.postorder, parallel: P.parallel }
    },
    { postorder: ordinal, parallel: [] }
  )

  return { key: graph.key, order: ordinal, postorder, parallel }
}

function orderTitledSteps(graph: TitledSteps<Unordered>, ordinal = 0): TitledSteps<Ordered> {
  const { postorder, steps } = graph.steps.reduce(
    (P: { postorder: number; steps: TitledStep<Ordered>[] }, _) => {
      const step = Object.assign({}, _, { graph: orderSequence(_.graph, P.postorder + 1) })
      P.steps.push(step)
      return { postorder: step.graph.postorder, steps: P.steps }
    },
    { postorder: ordinal, steps: [] }
  )

  return Object.assign({}, graph, { order: ordinal, postorder, steps })
}

export function orderSubTask(graph: SubTask<Unordered>, ordinal = 0): SubTask<Ordered> {
  const ordered = orderSequence(graph.graph, ordinal + 1)

  return Object.assign({}, graph, {
    order: ordinal,
    postorder: ordered.postorder,
    graph: ordered,
  })
}

function orderChoice(graph: Choice, ordinal = 0): Choice<Ordered> {
  const { postorder, choices } = graph.choices.reduce(
    (P: { postorder: number; choices: ChoicePart<Ordered>[] }, _) => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      const choice = Object.assign({}, _, { graph: orderSequence(_.graph, P.postorder + 1) })
      P.choices.push(choice)
      return { postorder: choice.graph.postorder, choices: P.choices }
    },
    { postorder: ordinal, choices: [] }
  )

  return Object.assign({}, graph, { order: ordinal, postorder, choices })
}

function orderCodeBlock(graph: CodeBlockProps, ordinal: number): CodeBlockProps & Ordered {
  return Object.assign({}, graph, { order: ordinal, postorder: ordinal })
}

// T extends Sequence ? Sequence<Ordered> : T extends Parallel ? Parallel<Ordered> : T extends Choice ? Choice<Ordered> : (CodeBlockProps & Ordered)
export function order(graph: Graph, ordinal = 0): Graph<Ordered> {
  if (ordinal === 0) {
    const debug = Debug("madwizard/timing/graph:order")
    debug("start")
  }

  try {
    if (isSequence(graph)) {
      return orderSequence(graph, ordinal)
    } else if (isParallel(graph)) {
      return orderParallel(graph, ordinal)
    } else if (isSubTask(graph)) {
      return orderSubTask(graph, ordinal)
    } else if (isTitledSteps(graph)) {
      return orderTitledSteps(graph, ordinal)
    } else if (isChoice(graph)) {
      return orderChoice(graph, ordinal)
    } else {
      return orderCodeBlock(graph, ordinal)
    }
  } finally {
    if (ordinal === 0) {
      const debug = Debug("madwizard/timing/graph:order")
      debug("complete")
    }
  }
}
