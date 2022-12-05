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

import { Memos } from "../memoization/index.js"
import { Validatable } from "../codeblock/index.js"
import { ExecOptions } from "../exec/index.js"
import { Status, Graph, isSequence, isParallel, isChoice, isTitledSteps, isSubTask, isValidatable } from "./index.js"

export type ValidationExecutor = (cmdline: string, opts?: ExecOptions) => "success" | Promise<"success">

/** Succeed only if all paths succeed, fail if any path fails */
function failFast(a: Status = "success", b: Status = "success") {
  if (a === "success" && b === "success") {
    return "success"
  } else if (a === "error" || b === "error") {
    return "error"
  } else if (a === "in-progress" || b === "in-progress") {
    return "in-progress"
  } else if (a === "pending" || b === "pending") {
    return "pending"
  } else if (a === "warning" || b === "warning") {
    return "warning"
  } else {
    return "blank"
  }
}

/** For choices, a success on any path is good */
function succeedFast(a: Status = "success", b: Status = "success") {
  if (a === "success" || b === "success") {
    return "success"
  } else {
    return failFast(a, b)
  }
}

function intersection(A: Promise<Status[]>) {
  return A.then((A) => A.slice(1).reduce(failFast, A[0]))
}

function union(A: Promise<Status[]>) {
  return A.then((A) => A.slice(1).reduce(succeedFast, A[0]))
}

export type ValidateOptions = { validator?: ValidationExecutor; throwErrors?: boolean }

/** This does an actual validation check */
export async function doValidate(
  validate: Validatable["validate"],
  memos: Memos,
  opts: Pick<ValidateOptions, "validator" | "throwErrors">
): Promise<Status> {
  if (validate === true) {
    return "success"
  } else if (typeof validate !== "string") {
    return "blank"
  }

  try {
    await (opts.validator || (await import("../exec/index.js").then((_) => _.shellExec)))(validate, memos, {
      quiet: true,
    })
    return "success"
  } catch (err) {
    if (opts.throwErrors) {
      throw err
    } else {
      return "blank"
    }
  }
}

/**
 * Note: this code assumes that collapseMadeChoices has already been
 * applied to the `graph`.
 */
async function validateGraph(graph: Graph, memos: Memos, opts: ValidateOptions): Promise<Status> {
  if (isValidatable(graph)) {
    return doValidate(graph.validate, memos, opts)
  } else if (isSequence(graph)) {
    return intersection(Promise.all(graph.sequence.map((_) => validateGraph(_, memos, opts))))
  } else if (isParallel(graph)) {
    return intersection(Promise.all(graph.parallel.map((_) => validateGraph(_, memos, opts))))
  } else if (isChoice(graph)) {
    return union(Promise.all(graph.choices.map((_) => validateGraph(_.graph, memos, opts))))
  } else if (isTitledSteps(graph)) {
    return intersection(Promise.all(graph.steps.map((_) => validateGraph(_.graph, memos, opts))))
  } else if (isSubTask(graph)) {
    return validateGraph(graph.graph, memos, opts)
  } else if (graph.optional) {
    // here we treat optional blocks as ... non-blockers
    // w.r.t. overall success
    return "success"
  } else {
    return "blank"
  }
}

export async function validate(graph: Graph, memos: Memos, opts: ValidateOptions): Promise<Status> {
  return (await validateGraph(graph, memos, opts)) || "blank"
}
