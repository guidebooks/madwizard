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

import { spawn } from "child_process"
import { Status, Graph, isSequence, isParallel, isChoice, isTitledSteps, isSubTask } from "."

export type ExecOptions = {
  /** Do not emit to console */
  quiet?: boolean

  /** Capture stdout here */
  capture?: string
}

export type ValidationExecutor = (cmdline: string, opts?: ExecOptions) => "success" | Promise<"success">

export async function shellExec(cmdline: string, opts: ExecOptions = { quiet: false }): Promise<"success"> {
  const capture = typeof opts.capture === "string"

  return new Promise((resolve, reject) => {
    const child = spawn(
      process.env.SHELL || (process.platform === "win32" ? "pwsh" : "bash"),
      ["-c", `set -o pipefail; ${cmdline}`],
      {
        stdio: opts.quiet
          ? ["inherit", "ignore", "pipe"]
          : capture
          ? ["inherit", "pipe", "pipe"]
          : ["inherit", "inherit", "inherit"],
      }
    )

    child.on("error", reject)

    let err = ""
    let out = ""
    child.on("close", (code) => {
      if (capture) {
        opts.capture = out
      }

      if (code === 0) {
        resolve("success")
      } else {
        reject(new Error(err || `${cmdline} failed`))
      }
    })

    if (opts.quiet) {
      child.stderr.on("data", (data) => (err += data.toString()))
    }

    if (capture) {
      child.stderr.on("data", (data) => (out += data.toString()))
      child.stdout.on("data", (data) => (out += data.toString()))
    }
  })
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

type Options = { validator?: ValidationExecutor; throwErrors?: boolean }

/**
 * Note: this code assumes that collapseMadeChoices has already been
 * applied to the `graph`.
 */
async function validateGraph(graph: Graph, opts: Options): Promise<Status> {
  if (isSequence(graph)) {
    return intersection(Promise.all(graph.sequence.map((_) => validateGraph(_, opts))))
  } else if (isParallel(graph)) {
    return intersection(Promise.all(graph.parallel.map((_) => validateGraph(_, opts))))
  } else if (isChoice(graph)) {
    return union(Promise.all(graph.choices.map((_) => validateGraph(_.graph, opts))))
  } else if (isTitledSteps(graph)) {
    return intersection(Promise.all(graph.steps.map((_) => validateGraph(_.graph, opts))))
  } else if (isSubTask(graph)) {
    return validateGraph(graph.graph, opts)
  } else if (graph.optional) {
    // here we treat optional blocks as ... non-blockers
    // w.r.t. overall success
    return "success"
  } else if (graph.validate) {
    try {
      await (opts.validator || shellExec)(graph.validate, { quiet: true })
      return "success"
    } catch (err) {
      if (opts.throwErrors) {
        throw err
      } else {
        return "blank"
      }
    }
  } else {
    return "blank"
  }
}

export async function validate(graph: Graph, opts: Options): Promise<Status> {
  return (await validateGraph(graph, opts)) || "blank"
}
