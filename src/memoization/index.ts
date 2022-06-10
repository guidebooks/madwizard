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
import { ChildProcess } from "child_process"

import { ExpansionMap } from "../choices/groups/expansion.js"
import { ChoiceState, newChoiceState } from "../choices/index.js"
import { Graph, Status, StatusMap, isLeafNode, isChoice, partsOf } from "../graph/index.js"

/** Optimize certain expensive or non-idempotent operations */
export interface Memos {
  /** Suggestions as to what the user might have done last time */
  suggestions: ChoiceState

  /** the `Status` of a given `LeafNode` in a `Graph` */
  statusMemo: StatusMap

  /** the expanded choices for a given `Choice`, keyed by it's `key` property */
  expansionMemo: ExpansionMap

  /** Any captured environment variable assignments. For example, a guidebook may want to update via `export FOO=bar` */
  env: typeof process.env

  /** Any collected dependencies that need to be injected into the runtime */
  dependencies: Record<string, string[]>

  /** Any forked subprocesses that we should wait for? */
  subprocesses: ChildProcess[]

  /** onExit handlers */
  onExit: { name: string; cb: () => void | Promise<void> }[]

  /** Invalidate any memos that make use of the given shell variable */
  invalidate(variable: string): void

  /** Cleanup any state, e.g. spawned subprocesses */
  cleanup(): void | Promise<void>
}

/** Default implementation of `Memos` */
export class Memoizer implements Memos {
  public constructor(public readonly suggestions: ChoiceState = newChoiceState()) {}

  /** the `Status` of a given `LeafNode` in a `Graph` */
  public readonly statusMemo: StatusMap = {}

  /** the expanded choices for a given `ChoicePart`, keyed by it's `expansionExpr` property */
  public readonly expansionMemo: ExpansionMap = {}

  /** Any captured environment variable assignments. For example, a guidebook may want to update via `export FOO=bar` */
  public readonly env = {}

  /** Any collected dependencies that need to be injected into the runtime */
  public dependencies = {}

  /** Any forked subprocesses that we should wait for? */
  public subprocesses: ChildProcess[] = []

  /** onExit handlers */
  public onExit: Memos["onExit"] = []

  /** Invalidate any memos that make use of the given shell variable */
  public invalidate(variable: string): void {
    // invalidate $X, ${X}, printenv X
    const pattern = new RegExp("(\\$|(printenv\\s+))\\{?" + variable + "\\}?")

    Object.keys(this.statusMemo)
      .filter((key) => pattern.test(key)) // list of matching keys
      .forEach((matchingKey) => delete this.expansionMemo[matchingKey])

    Object.keys(this.expansionMemo)
      .filter((key) => pattern.test(key)) // list of matching keys
      .forEach((matchingKey) => {
        Debug("madwizard/cleanup")("invalidating expansion", variable, pattern, matchingKey)
        delete this.expansionMemo[matchingKey]
      })
  }

  /** Cleanup any state, e.g. spawned subprocesses */
  public cleanup(): void {
    if (this.subprocesses.length > 0) {
      try {
        // re: `reverse()`, we intentionally iterate over the
        // subprocesses in *reverse* order. The assumption here is
        // that we need to "unwind" the subprocesses. If we kill older
        // subprocesses first, then the later kills may fail because
        // those later processes depend on state or connections being maintained by the earlier
        // ones; e.g. kubernetes port forwards.
        this.onExit.reverse().forEach(({ name, cb }) => {
          try {
            Debug("madwizard/cleanup")(name)
            cb()
          } catch (err) {
            Debug("madwizard/cleanup")("error in onExit handler " + name, err)
          }
        })

        // same here, re: `reverse()`
        this.subprocesses.reverse().forEach((child) => {
          Debug("madwizard/cleanup")("killing process " + child.pid)

          // TODO windows...
          // maybe https://medium.com/@almenon214/killing-processes-with-node-772ffdd19aad
          try {
            process.kill(-child.pid) // kill the process group e.g. for pipes
          } catch (err) {
            Debug("madwizard/cleanup")("error killing process group " + -child.pid, err)
          }

          try {
            child.kill()
          } catch (err) {
            Debug("madwizard/cleanup")("error killing process " + child.pid, err)
          }
        })
      } catch (err) {
        Debug("madwizard/cleanup")("error killing forked subprocess", err)
      }
    }
  }
}

/** Percolate up any memoized status */
export function statusOf(graph: Graph, statusMemo: StatusMap, choices: ChoiceState): Status {
  if (isLeafNode(graph)) {
    // either we have already executed it, or we have validated it as having been previously executed
    return (
      statusMemo[graph.id] ||
      (graph.validate === true ? "success" : graph.validate !== false ? statusMemo[graph.validate] : "blank")
    )
  } else {
    const parts = partsOf(graph)
    const statuses = parts.map((_) => statusOf(_, statusMemo, choices))

    if (isChoice(graph)) {
      // is exactly one branch a success? then we can elect it, otherwise, be conservative
      const status = statuses.filter((_) => _ === "success").length === 1 ? "success" : "blank"
      if (status === "success") {
        if (choices) {
          const goodIdx = statuses.findIndex((_) => _ === "success")
          if (goodIdx >= 0) {
            // and memoize that we elected it...
            const chosenTitle = graph.choices[goodIdx].title
            choices.set(graph, chosenTitle)
          }
        }
        return "success"
      }
    } else {
      // are all paths a success?
      return statuses.every((_) => _ === "success") ? "success" : statuses.includes("error") ? "error" : "blank"
    }
  }
}
