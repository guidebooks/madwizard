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

import { sequence } from "./nodes/Sequence.js"
import { CompileOptions, Graph } from "./index.js"

import hoistSubTasks from "./hoistSubTasks.js"
import propagateTitles from "./propagateTitles.js"
import collapseValidated from "./collapseValidated.js"
import collapseMadeChoices from "./collapseMadeChoices.js"
import deadCodeElimination from "./deadCodeElimination.js"

export default async function optimize(graph: Graph, choices: ChoiceState, memos: Memos, options?: CompileOptions) {
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
export async function optimize2(
  graph: Graph,
  choices: ChoiceState,
  memos: Memos,
  doExpand: (...params: Parameters<typeof expand>) => Graph | Promise<Graph>
) {
  const expanded = await doExpand(graph, choices, memos)
  return collapseMadeChoices(expanded, choices)
}
