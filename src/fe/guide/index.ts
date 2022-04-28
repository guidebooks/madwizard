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
import { EOL } from "os"
import chalk from "chalk"
import wrap from "wrap-ansi"
import { Listr } from "listr2"
import readline from "readline"
import { Writable } from "stream"
import { mainSymbols } from "figures"
import { EventEmitter } from "events"
import inquirer, { Question, Answers } from "inquirer"

import decorateStream from "./stream-decorator"

import { ChoiceState } from "../../choices"
import { CodeBlockProps } from "../../codeblock"
import indent from "../../parser/markdown/util/indent"
import { UI, AnsiUI, prettyPrintUITreeFromBlocks } from "../tree"
import { wizardify, ChoiceStep, TaskStep, isChoiceStep, isTaskStep } from "../../wizard"
import { Graph, Status, blocks, compile, extractTitle, extractDescription, shellExec, validate } from "../../graph"

export class Guide {
  private readonly debug = Debug("madwizard/fe/guide")

  public constructor(
    private readonly blocks: CodeBlockProps[],
    private readonly choices: ChoiceState,
    private readonly prompt = inquirer.createPromptModule(),
    private readonly ui: UI<string> = new AnsiUI()
  ) {}

  private format(str: string, indentation = "  ") {
    return indent(wrap(this.ui.markdown(str.trim()), Math.min(100, process.stdout.columns - 5)), indentation)
  }

  /**
   * @param iter How many questions have we asked so far?
   * @return the list of remaining questions
   */
  private questions(iter: number) {
    const graph = compile(this.blocks, this.choices)
    const steps = wizardify(graph)

    const choiceSteps = steps.filter(isChoiceStep)
    const taskSteps = steps.filter(isTaskStep)

    const questions = choiceSteps.map(({ step }, stepIdx) => ({
      type: "list",
      pageSize: 20,
      name: step.name,
      message: chalk.yellow(`Choice ${iter + stepIdx + 1}:` + ` ${step.name}`),
      choices: step.content.map((tile, idx, A) => ({
        value: tile.title,
        short: tile.title,
        name:
          chalk.bold(tile.title) +
          (!tile.description ? "" : EOL + this.format(tile.description) + (idx === A.length - 1 ? "" : EOL)),
      })),
    }))

    return {
      graph,
      choiceSteps,
      taskSteps,
      questions,
    }
  }

  private incorporateAnswers(choiceSteps: ChoiceStep[], answers: Answers) {
    Object.values(answers).forEach((chosenTitle, stepIdx) => {
      const { graph } = choiceSteps[stepIdx]
      this.choices.set(graph.group, chosenTitle)
    })
  }

  private ask(questions: Question[]) {
    if (questions.length > 0) {
      return this.prompt(questions)
    }
  }

  private firstBitOf(msg: string) {
    return msg.slice(0, 50).split(/\n/)[0]
  }

  private listrTaskStep({ step, graph }: TaskStep, taskIdx: number, dryRun: boolean) {
    const subtasks = blocks(graph)

    let doneCount = 0
    const markDone = (status: Status) => {
      if (++doneCount === subtasks.length) {
        this.markDone(taskIdx, status)
      }
    }

    return {
      title: step.name,
      options: { showTimer: true, collapse: dryRun, exitOnError: !dryRun },
      task: (ctx, task) =>
        task.newListr(
          subtasks.map((block) => ({
            title: block.validate
              ? chalk.dim("checking to see if this task has already been done\u2026")
              : chalk[taskIdx === 1 ? "reset" : "dim"].magenta(block.body),
            options: {
              persistentOutput: !dryRun,
              removeEmptyLines: false,
              collapse: dryRun,
              bottomBar: dryRun ? false : Infinity,
              exitOnError: !dryRun,
            },
            task: async (_, subtask) => {
              let status: Status = "blank"

              try {
                if (block.validate) {
                  try {
                    status = await validate(block, { throwErrors: dryRun })
                    if (status === "success") {
                      subtask.skip()
                      return
                    }
                  } catch (err) {
                    if (dryRun) {
                      // task.state = ListrTaskState.FAILED
                      task.title += dryRun
                        ? chalk.yellow(" [NOT READY] " + chalk.dim(this.firstBitOf(err.message)))
                        : chalk.red(" [FAILED] " + chalk.dim(this.firstBitOf(err.message)))
                    } else {
                      // throw new ListrError(err, ListrErrorTypes.HAS_FAILED, task)
                      this.debug("Validation error", err)
                    }
                  }
                }

                try {
                  if (!dryRun) {
                    await this.waitTillDone(taskIdx - 1)
                    subtask.title = chalk.magenta(block.body)
                    status = await shellExec(block.body, decorateStream(block, subtask.stdout(), this.ui))
                  }
                } catch (err) {
                  status = "error"
                  throw err
                } finally {
                  subtask.title = chalk.magenta(block.body)
                }
              } finally {
                markDone(status)
              }
            },
          }))
        ),
    }
  }

  private waitForEnter() {
    const mutedStdout = new Writable({
      write: function (chunk, encoding, callback) {
        callback()
      },
    })

    const rl = readline.createInterface({
      input: process.stdin,
      output: mutedStdout,
    })

    return new Promise<void>((resolve) => {
      rl.on("close", resolve)

      rl.question("", () => {
        rl.close()
        resolve()
      })
    })
  }

  private listrPauseStep(taskIdx: number) {
    return [
      {
        task: async () => {
          await this.waitTillDone(taskIdx - 1)
          await this.waitForEnter()
          this.markDone(taskIdx, "success")
        },
      },
    ]
  }

  private readonly done: Status[] = []
  private readonly doneEvents = new EventEmitter()
  private allDoneSuccessfully() {
    return this.done.every((_) => _ === "success")
  }
  private markDone(taskIdx: number, status: Status) {
    this.done[taskIdx] = status
    this.doneEvents.emit(taskIdx.toString())
  }
  private waitTillDone(taskIdx: number): Promise<void> {
    if (!this.done[taskIdx]) {
      return new Promise<void>((resolve) =>
        this.doneEvents.once(taskIdx.toString(), () => {
          resolve()
        })
      )
    }
  }

  /** @return whether we actually ran them */
  private async runTasks(taskSteps: TaskStep[]): Promise<boolean> {
    const { execution } = await this.prompt([
      {
        type: "list",
        name: "execution",
        message: chalk.yellow("How do you wish to execute this guidebook?"),
        choices: [
          { value: "dryr", name: "Dry run 👀" },
          { value: "auto", name: "Run unattended 🤖" },
          new inquirer.Separator(),
          { value: "tree", name: "Show me the plan" },
          { value: "step", name: "Step me through the execution" },
          new inquirer.Separator(),
          { value: "stop", name: "Cancel" },
        ],
      },
    ])

    if (execution === "stop") {
      return false
    } else if (execution === "tree") {
      prettyPrintUITreeFromBlocks(this.blocks, this.choices)
      console.log()
      return this.runTasks(taskSteps)
    } else if (execution === "step") {
      console.log("🖐  Hit enter after every step to proceed to the next step, or ctrl+c to cancel.")
      console.log()
    }

    const stepIt = execution === "step"
    const dryRun = execution === "dryr"

    const taskPromise = new Listr(
      taskSteps.flatMap((_, idx, A) => [
        this.listrTaskStep(_, stepIt ? idx * 2 + 1 : idx + 1, dryRun),
        ...(stepIt && idx < A.length - 1 ? this.listrPauseStep(idx * 2 + 2) : []),
      ]),
      {
        /* options */
        concurrent: dryRun,
      }
    ).run()

    this.markDone(0, "success")
    await taskPromise

    return true // we actually ran the tasks
  }

  /** Emit the title and description of the given `graph` */
  private presentGuidebookTitle(graph: Graph) {
    const title = extractTitle(graph)
    const description = extractDescription(graph)
    if (title) {
      console.log(chalk.inverse.bold(` ${title.trim()} `))
    }
    if (description) {
      console.log(this.format(description))
    }

    if (title || description) {
      console.log()
    }
  }

  /** Iterate until all choices have been resolved */
  private async resolveChoices(iter = 0) {
    const { graph, choiceSteps, taskSteps, questions } = await this.questions(iter)

    if (iter === 0) {
      this.presentGuidebookTitle(graph)
    }

    if (questions.length === 0) {
      return taskSteps
    } else {
      // note that we ask one question at a time, because the answer
      // to the first question may influence what question we ask next
      await this.incorporateAnswers(choiceSteps, await this.ask(questions.slice(0, 1)))
      return this.resolveChoices(iter + 1)
    }
  }

  public async run() {
    console.clear()
    const taskSteps = await this.resolveChoices()
    try {
      const tasksWereRun = await this.runTasks(taskSteps)

      if (tasksWereRun) {
        if (this.allDoneSuccessfully()) {
          console.log(EOL + chalk.green(mainSymbols.tick) + " Guidebook successful")
        } else {
          console.log(EOL + chalk.yellow(mainSymbols.warning) + " Guidebook incomplete")
        }
      }
    } catch (err) {
      throw new Error(EOL + chalk.red(mainSymbols.cross) + " Run failed")
    }
  }
}
