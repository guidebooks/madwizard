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

import { EOL } from "os"
import ora, { Ora } from "ora"
import { mainSymbols } from "figures"
import chalk, { ChalkInstance } from "chalk"
import promiseEach from "../../util/promise-each.js"

/** The API passed to the client, to give it some control points */
interface TaskWrapper {
  skip(parentheticalMsg?: string, fullMsg?: string): void
  fail(parentheticalMsg?: string, fullMsg?: string, chalk?: ChalkInstance): void
  commence(msg?: string): void
  // stdout(): NodeJS.WriteStream & NodeJS.WritableStream
}

type TaskFn = (task: TaskWrapper) => Promise<void> | Task[]

export interface Task {
  title?: string
  spinner?: boolean
  quiet?: boolean
  task: Task[] | TaskFn
}

export interface TaskRunnerOptions {
  /** Only emit executions, no window dressings */
  quiet?: boolean

  /** TODO Not yet supported */
  concurrent?: boolean
}

export function skip(ora: Ora, text: string) {
  ora.stopAndPersist({
    text,
    symbol: chalk.blue(mainSymbols.arrowDown),
  })
}

class TaskWrapperImpl implements TaskWrapper {
  public constructor(
    private readonly title: string,
    private readonly write = process.stdout.write.bind(process.stdout),
    private readonly quiet = false,
    private readonly spinner?: ReturnType<typeof ora>
  ) {}

  public skip(parentheticalMsg = "SKIPPED", fullMsg = ` [${parentheticalMsg}]`) {
    if (this.spinner) {
      skip(this.spinner, this.title + chalk.yellow(fullMsg))
    } else if (!this.quiet) {
      this.write(chalk.yellow(fullMsg))
      this.write(EOL)
    }
  }

  public fail(parentheticalMsg = "FAILED", fullMsg = ` [${parentheticalMsg}]`, chalker = chalk.red) {
    if (this.spinner) {
      this.spinner.fail(this.title + chalker(fullMsg))
      this.spinner.stop()
    } else {
      this.commence(chalker(fullMsg))
    }
  }

  public commence(msg?: string) {
    if (this.spinner) {
      this.spinner.stop()
    }

    if (msg) {
      this.write(msg)
    }

    if (msg || !this.quiet) {
      this.write(EOL)
    }
  }

  /* public stdout() {
    return this.stream
  } */
}

export async function taskRunner(
  tasks: Task[],
  options: TaskRunnerOptions = {},
  write = process.stdout.write.bind(process.stdout),
  depth = 0
) {
  await promiseEach(tasks, async ({ title, task, spinner, quiet }, idx) => {
    if (idx > 0 && !options.quiet && !quiet) {
      // write(EOL)
    }

    if (!spinner && title && !quiet) {
      write(title)
    }

    if (Array.isArray(task)) {
      // subtasks
      if (!options.quiet && !quiet) {
        write(EOL)
      }
      await taskRunner(task, options, write, depth + 1)
    } else {
      const wrapper = new TaskWrapperImpl(title, write, quiet, !quiet && spinner ? ora(title).start() : undefined)
      const response = await task(wrapper)
      if (Array.isArray(response)) {
        if (!options.quiet && !quiet) {
          write(EOL)
        }
        await taskRunner(response, options, write, depth + 1)
      }
    }
  })
}
