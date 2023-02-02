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
import { ChoiceState, emptyChoiceState } from "../choices/index.js"
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
  onExit: { name: string; cb: (signal?: "SIGINT" | "SIGTERM") => void | Promise<void> }[]

  /** Finally block context stack */
  finallyStack: string[]

  /** Invalidate any memos that make use of the given shell variable */
  invalidate(variable: string): void

  /** Do we have anything to clean up? */
  currentlyNeedsCleanup(): boolean

  /** Cleanup any state, e.g. spawned subprocesses */
  cleanup(signal?: "SIGINT" | "SIGTERM"): void | Promise<void>
}

/** Default implementation of `Memos` */
export class Memoizer implements Memos {
  public constructor(public readonly suggestions: ChoiceState = emptyChoiceState()) {}

  /** the `Status` of a given `LeafNode` in a `Graph` */
  public readonly statusMemo: StatusMap = {}

  /** the expanded choices for a given `ChoicePart`, keyed by it's `expansionExpr` property */
  public readonly expansionMemo: ExpansionMap = {}

  /** Any captured environment variable assignments. For example, a guidebook may want to update via `export FOO=bar` */
  public readonly env: typeof process.env = {}

  /** Any collected dependencies that need to be injected into the runtime */
  public readonly dependencies = {}

  /** Any forked subprocesses that we should wait for? */
  public readonly subprocesses: ChildProcess[] = []

  /** onExit handlers */
  public readonly onExit: Memos["onExit"] = []

  /** Finally block context stack */
  public readonly finallyStack: string[] = []

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

  /** Do we have anything to clean up? */
  public currentlyNeedsCleanup(): boolean {
    return this.onExit.length > 0 || this.subprocesses.length > 0
  }

  /** Cleanup any state, e.g. spawned subprocesses */
  public async cleanup(signal?: "SIGINT" | "SIGTERM"): Promise<void> {
    try {
      // re: `reverse()`, we intentionally iterate over the
      // subprocesses in *reverse* order. The assumption here is
      // that we need to "unwind" the subprocesses. If we kill older
      // subprocesses first, then the later kills may fail because
      // those later processes depend on state or connections being maintained by the earlier
      // ones; e.g. kubernetes port forwards.
      await Promise.all(
        this.onExit.reverse().map(async ({ name, cb }) => {
          try {
            Debug("madwizard/cleanup")(name)
            await cb(signal)
          } catch (err) {
            Debug("madwizard/cleanup")("error in onExit handler " + name, err)
          }
        })
      )

      if (this.subprocesses.length > 0) {
        let N = this.subprocesses.length
        Debug("madwizard/cleanup")("number of forked subprocess to kill: " + N)

        try {
          // same here, re: `reverse()`
          this.subprocesses.reverse().forEach((child) => {
            Debug("madwizard/cleanup")("killing process " + child.pid)

            try {
              // TODO windows...
              // maybe https://medium.com/@almenon214/killing-processes-with-node-772ffdd19aad
              try {
                process.kill(-child.pid, "SIGKILL") // kill the process group e.g. for pipes
              } catch (err) {
                Debug("madwizard/cleanup")("error killing process group " + -child.pid, err)
              }

              try {
                child.kill("SIGKILL")
              } catch (err) {
                Debug("madwizard/cleanup")("error killing process " + child.pid, err)
              }
            } finally {
              Debug("madwizard/cleanup")("done killing process " + child.pid + " nRemaining=" + --N)
            }
          })
        } catch (err) {
          Debug("madwizard/cleanup")("error killing forked subprocess", err)
        } finally {
          Debug("madwizard/cleanup")("done killing forked subprocess")
        }
      } else {
        Debug("madwizard/cleanup")("no forked subprocess to kill")
      }
    } finally {
      Debug("madwizard/cleanup")("done with cleanup")
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
