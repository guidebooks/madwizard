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

import { Status, Graph, isSequence, isParallel, isChoice, isTitledSteps, isSubTask } from "."

export type ValidationExecutor = (cmdline: string) => "success" | Promise<"success">

async function shellExec(cmdline: string): Promise<"success"> {
  const { exec } = await import("child_process")
  return new Promise((resolve, reject) =>
    exec(cmdline, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve("success")
      }
    })
  )
}

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

/**
 * Note: this code assumes that collapseMadeChoices has already been
 * applied to the `graph`.
 */
async function validateGraph(graph: Graph, executor: ValidationExecutor): Promise<Status> {
  if (isSequence(graph)) {
    return intersection(Promise.all(graph.sequence.map((_) => validateGraph(_, executor))))
  } else if (isParallel(graph)) {
    return intersection(Promise.all(graph.parallel.map((_) => validateGraph(_, executor))))
  } else if (isChoice(graph)) {
    return union(Promise.all(graph.choices.map((_) => validateGraph(_.graph, executor))))
  } else if (isTitledSteps(graph)) {
    return intersection(Promise.all(graph.steps.map((_) => validateGraph(_.graph, executor))))
  } else if (isSubTask(graph)) {
    return validateGraph(graph.graph, executor)
  } else if (graph.optional) {
    // here we treat optional blocks as ... non-blockers
    // w.r.t. overall success
    return "success"
  } else if (graph.validate) {
    try {
      await executor(graph.validate)
      return "success"
    } catch (err) {
      return "blank"
    }
  } else {
    return "blank"
  }
}

export async function validate(graph: Graph, executor = shellExec): Promise<Status> {
  return (await validateGraph(graph, executor)) || "blank"
}
