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

/** Subtype of valid Tasks that are used to debug madwizard */
export type DebugTask = "debug:timing" | "debug:fetch" | "debug:topmatter" | "debug:groups" | "debug:graph"

/** @return the list of valid Tasks to run via the CLI client */
function validDebugTasks(): DebugTask[] {
  return ["debug:timing", "debug:fetch", "debug:topmatter", "debug:groups", "debug:graph"]
}

/** @return whether the given `task` is used for its debug output, not for any other effect */
export function isDebugTask(task: Task): task is DebugTask {
  return validDebugTasks().includes(task as DebugTask)
}

/** The type definining the valid Tasks to run via the CLI client */
export type Task = "plan" | "guide" | "run" | "json" | "version" | "vetoes" | "build" | "mirror" | DebugTask

/** @return the list of valid Tasks to run via the CLI client */
export function validTasks(): Task[] {
  const normalTasks: Task[] = ["plan", "guide", "run", "json", "version", "vetoes", "build", "mirror"]
  return normalTasks.concat(validDebugTasks())
}

/** @return whether the given `task` is an instance of the valid CLI `Task` types */
export function isValidTask(task: string): task is Task {
  return validTasks().includes(task as Task)
}
