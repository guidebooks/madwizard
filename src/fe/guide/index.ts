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
import readline from "readline"
import { Writable } from "stream"
import { mainSymbols } from "figures"
import { EventEmitter } from "events"
import inquirer, { Question, Answers } from "inquirer"

import { taskRunner, Task } from "./taskrunner"

import { MadWizardOptions } from "../../"
import { ChoiceState } from "../../choices"
import { CodeBlockProps } from "../../codeblock"
import indent from "../../parser/markdown/util/indent"
import { Memos, Memoizer, statusOf } from "../../memoization"
import { UI, AnsiUI, prettyPrintUITreeFromBlocks } from "../tree"
import { ChoiceStep, TaskStep, Wizard, isChoiceStep, isTaskStep, wizardify } from "../../wizard"
import { Graph, Status, blocks, compile, extractTitle, extractDescription, shellExec, validate } from "../../graph"

export class Guide {
  private readonly debug = Debug("madwizard/fe/guide")

  public constructor(
    private readonly task: "guide" | "run",
    private readonly blocks: CodeBlockProps[],
    private readonly choices: ChoiceState,
    private readonly options: MadWizardOptions,
    private readonly memos: Memos = new Memoizer(),
    private readonly prompt = inquirer.createPromptModule(),
    private readonly ui: UI<string> = new AnsiUI()
  ) {}

  private get isGuided() {
    return this.task === "guide"
  }

  private format(str: string, indentation = "  ") {
    return indent(this.ui.markdown(str.trim()), indentation)
  }

  /**
   * @param iter How many questions have we asked so far?
   * @return the list of remaining questions
   */
  private async questions(iter: number, previous?: Wizard) {
    const graph = await compile(this.blocks, this.choices, Object.assign({}, this.options, this.memos))
    const wizard = await wizardify(graph, { previous, statusMemo: this.memos.statusMemo, choices: this.choices })

    const firstChoiceIdx = wizard.findIndex((_) => isChoiceStep(_) && _.status !== "success")
    const preChoiceSteps = firstChoiceIdx < 0 ? [] : wizard.slice(0, firstChoiceIdx).filter(isTaskStep)
    // no: run all tasks up to the first barrier: .filter((_) => isBarrier(_.graph))

    const choices = wizard.filter(isChoiceStep).filter((_) => _.status !== "success")
    const preChoiceTasks = preChoiceSteps.filter((_) => _.status !== "success")
    const postChoiceTasks = wizard.filter(isTaskStep).filter((_) => _.status !== "success")

    const questions = choices.map(({ step }, stepIdx) => ({
      type: "list",
      pageSize: 40,
      name: step.name || chalk.red("Missing name"),
      message: chalk.yellow(`Choice ${iter + stepIdx + 1}:` + ` ${step.name || chalk.red("Missing name")}`),
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
      wizard,
      choices,
      preChoiceTasks,
      postChoiceTasks,
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

  private listrTaskStep({ step, graph }: TaskStep, taskIdx: number, dryRun: boolean): Task {
    const subtasks = blocks(graph)

    let doneCount = 0
    const markDone = (status: Status) => {
      if (++doneCount === subtasks.length) {
        this.markDone(taskIdx, status)
      }
    }

    return {
      title: !this.isGuided
        ? ""
        : (dryRun ? chalk.yellow(mainSymbols.questionMarkPrefix) : chalk.green(mainSymbols.play)) + " " + step.name,
      task: () =>
        subtasks.map(
          (block): Task => ({
            title: block.validate
              ? chalk.dim("checking to see if this task has already been done\u2026")
              : this.ui.code(block.body, block.language),
            spinner: !!block.validate,
            task: async (subtask) => {
              let status: Status = statusOf(block, this.memos.statusMemo, this.choices)

              try {
                if (status !== "success" && block.validate) {
                  try {
                    status = await validate(block, Object.assign({}, this.memos, { throwErrors: dryRun }))
                    if (status === "success") {
                      subtask.skip(dryRun ? "READY" : undefined)
                      return
                    }
                  } catch (err) {
                    if (dryRun) {
                      this.debug("validation error", err)
                      subtask.fail(dryRun ? "NOT READY" : undefined, undefined, dryRun ? chalk.yellow : undefined)
                    } else {
                      // throw new ListrError(err, ListrErrorTypes.HAS_FAILED, task)
                      this.debug("Validation error", err)
                    }
                  }
                }

                try {
                  if (!dryRun) {
                    subtask.commence()
                    await this.waitTillDone(taskIdx - 1)

                    const statusMemoKey = block.id
                    status =
                      (this.memos.statusMemo && this.memos.statusMemo[statusMemoKey] === "success" && "success") ||
                      (await shellExec(block.body, this.memos, block.language, block.exec))

                    if (status == "success" && this.memos.statusMemo) {
                      this.memos.statusMemo[statusMemoKey] = status
                    }
                  }
                } catch (err) {
                  status = "error"
                  throw err
                } finally {
                  // subtask.title = chalk.magenta(block.body)
                }
              } finally {
                markDone(status)
              }
            },
          })
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

  /** Visualize the current execution plan, which reflects all choices made so far. */
  private async showPlan(skipOptionalBlocks = true, skipFirstTitle = false, narrow = false) {
    await prettyPrintUITreeFromBlocks(
      !skipOptionalBlocks ? this.blocks : this.blocks.filter((_) => !_.optional),
      this.choices,
      { skipFirstTitle, /* indent: "  ",*/ narrow, root: chalk.blue.bold("The Plan") }
    )

    console.log()
  }

  /** @return whether we actually ran them */
  private async runTasks(taskSteps: TaskStep[], execution: "auto" | "step" | "dryr" = "auto"): Promise<boolean> {
    if (execution === "step") {
      console.log("🖐  Hit enter after every step to proceed to the next step, or ctrl+c to cancel.")
      console.log()
    }

    const stepIt = execution === "step"
    const dryRun = execution === "dryr"

    const taskPromise = taskRunner(
      taskSteps
        .filter((_) => _.status !== "success")
        .flatMap((_, idx, A) => [
          this.listrTaskStep(_, stepIt ? idx * 2 + 1 : idx + 1, dryRun),
          ...(stepIt && idx < A.length - 1 ? this.listrPauseStep(idx * 2 + 2) : []),
        ]),
      {
        /* options */
        quiet: !this.isGuided,
        concurrent: dryRun,
      }
    )

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
  private async resolveChoices(iter = 0, previous?: Wizard) {
    const qs = await this.questions(iter, previous)
    const { graph, choices, preChoiceTasks, postChoiceTasks, questions, wizard } = qs

    if (iter === 0) {
      if (questions.length > 0 && this.isGuided) {
        // start a fresh screen before presenting the first question
        console.clear()
      }

      if (this.isGuided) {
        this.presentGuidebookTitle(graph)
      }
    }

    if (questions.length === 0) {
      return postChoiceTasks
    } else if (preChoiceTasks.length > 0) {
      await this.runTasks(preChoiceTasks)
      return this.resolveChoices(iter + 1, wizard)
    } else if (!this.isGuided) {
      // we have unresolved questions, but were asked to run a non-guided execution :(
      throw new Error(
        `Unable to run this guidebook, due to ${questions.length} unresolved question${
          questions.length === 1 ? "" : "s"
        }`
      )
    } else {
      // note that we ask one question at a time, because the answer
      // to the first question may influence what question we ask next
      await this.incorporateAnswers(choices, await this.ask(questions.slice(0, 1)))
      return this.resolveChoices(iter + 1, wizard)
    }
  }

  public async run() {
    const tasks = await this.resolveChoices()
    try {
      // await this.showPlan(true, true)
      const tasksWereRun = await this.runTasks(tasks)

      if (tasksWereRun && this.isGuided) {
        if (this.allDoneSuccessfully()) {
          console.log()
          console.log("✨ Guidebook successful")
        } else {
          console.log()
          console.log(chalk.red("Guidebook incomplete"))
        }
      }
    } catch (err) {
      throw new Error(chalk.red(mainSymbols.cross) + " Run failed: " + err.message)
    }
  }
}
