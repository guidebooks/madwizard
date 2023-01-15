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

import { Memos } from "../memoization/index.js"
import { ChoiceState, expand } from "../choices/index.js"

import { CompileOptions } from "./compile.js"
import Graph, { hasSource } from "./Graph.js"

import { subtask } from "./nodes/SubTask.js"
import { sequence } from "./nodes/Sequence.js"
import { extractTitle } from "./nodes/EnTitled.js"

import hoistSubTasks from "./hoistSubTasks.js"
import propagateTitles from "./propagateTitles.js"
import collapseValidated from "./collapseValidated.js"
import collapseMadeChoices from "./collapseMadeChoices.js"
import deadCodeElimination from "./deadCodeElimination.js"

import workaroundMultipleChoicesPerFile from "./workaroundMultipleChoicesPerFile.js"

async function optimize(graph: Graph, choices: ChoiceState, memos: Memos, options?: CompileOptions) {
  const debug = Debug("madwizard/timing/graph:optimize")
  debug("start")

  try {
    return (
      propagateTitles(
        deadCodeElimination(
          await collapseValidated(
            deadCodeElimination(hoistSubTasks(collapseMadeChoices(deadCodeElimination(graph), choices))),
            memos,
            options
          )
        )
      ) || sequence([])
    )
  } finally {
    debug("complete")
  }
}

/** Second-pass optimizations. Here we only expand nested expand(). */
async function optimize2(
  graph: Graph,
  choices: ChoiceState,
  memos: Memos,
  doExpand: (...params: Parameters<typeof expand>) => Graph | Promise<Graph>
) {
  const expanded = await doExpand(graph, choices, memos)
  return collapseMadeChoices(expanded, choices)
}

export default async function fullOptimize(
  graph: Graph | undefined,
  choices: ChoiceState,
  memos: Memos,
  options?: CompileOptions,
  title?: string,
  description?: string
): Promise<Graph> {
  if (!graph) {
    return graph
  }

  const willNotOptimize = options.optimize === false

  const doExpand: (...params: Parameters<typeof expand>) => Graph | Promise<Graph> =
    options.expand === false ? (x) => x : expand

  const unoptimized = workaroundMultipleChoicesPerFile(await doExpand(graph, choices, memos))

  let optimized = willNotOptimize ? unoptimized : await optimize(unoptimized, choices, memos, options)

  if (title && !extractTitle(optimized)) {
    optimized = subtask(
      title,
      title,
      title,
      description,
      "",
      sequence([optimized]),
      hasSource(unoptimized) ? unoptimized.source : undefined
    )
  }

  return willNotOptimize ? unoptimized : await optimize2(optimized, choices, memos, doExpand)
}
