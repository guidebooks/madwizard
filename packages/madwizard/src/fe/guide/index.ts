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
import enquirer from "enquirer"
import readline from "readline"
import { Writable } from "stream"
import { mainSymbols } from "figures"
import { EventEmitter } from "events"

import { taskRunner, Task } from "./taskrunner.js"

import { eqSet } from "../../util/set.js"
import { MadWizardOptions } from "../../index.js"
import { ChoiceState } from "../../choices/index.js"
import { isEarlyExit } from "../../exec/EarlyExit.js"
import { CodeBlockProps } from "../../codeblock/index.js"
import { shellExec, isExport } from "../../exec/index.js"
import indent from "../../parser/markdown/util/indent.js"
import { Memos, statusOf } from "../../memoization/index.js"
import { UI, AnsiUI, prettyPrintUITreeFromBlocks } from "../tree/index.js"
import { Graph, Status, blocks, compile, extractTitle, extractDescription, validate } from "../../graph/index.js"
import {
  ChoiceStep,
  TaskStep,
  Wizard,
  isChoiceStep,
  isForm,
  isMultiSelect,
  isTaskStep,
  wizardify,
} from "../../wizard/index.js"

/** A question for which we will use the answer from the current profile (i.e. from a previously-made choice) */
type AlreadyAnswered = {
  type: "AlreadyAnswered"
  name: string
  message: string
  answer: string
}

function isAlreadyAnswered(question: Question): question is AlreadyAnswered {
  return question.type === "AlreadyAnswered"
}

/** Some form of interrogative to pose to the user */
type SelectLikeQuestion = enquirer.prompt.SelectQuestionOptions | enquirer.prompt.MultiSelectQuestionOptions
type Question = SelectLikeQuestion | enquirer.prompt.FormQuestionOptions | AlreadyAnswered

export class Guide {
  private readonly debug = Debug("madwizard/fe/guide")

  public constructor(
    private readonly task: "guide" | "run",
    private readonly blocks: CodeBlockProps[],
    private readonly choices: ChoiceState,
    private readonly options: MadWizardOptions,
    private readonly memos: Memos,
    private readonly ui: UI<string> = new AnsiUI(),
    private readonly write?: Writable["write"]
  ) {}

  private get isGuided() {
    return this.task === "guide"
  }

  private format(str: string, indentation = "  ") {
    return indent(this.ui.markdown(str.trim()), indentation)
  }

  private get suggestionHint() {
    // reset the underlining from enquirer
    return chalk.reset.yellow.dim("  ◄ prior choice")
  }

  /**
   * @param iter How many questions have we asked so far?
   * @return the list of remaining questions
   */
  private async questions(choiceIter: number, previous?: Wizard) {
    const graph = await compile(this.blocks, this.choices, Object.assign({}, this.options, this.memos), this.options)
    const wizard = await wizardify(graph, this.memos, { previous, choices: this.choices })

    const firstChoiceIdx = wizard.findIndex((_) => isChoiceStep(_) && _.status !== "success")
    const preChoiceSteps = firstChoiceIdx < 0 ? [] : wizard.slice(0, firstChoiceIdx).filter(isTaskStep)
    // no: run all tasks up to the first barrier: .filter((_) => isBarrier(_.graph))

    const choices = wizard.filter(isChoiceStep).filter((_) => _.status !== "success")
    const preChoiceTasks = preChoiceSteps.filter((_) => _.status !== "success")
    const postChoiceTasks = wizard.filter(isTaskStep).filter((_) => _.status !== "success")

    // re: slice(0, 1), we ask one question at a time, so there is no
    // need to waste time computing the question models for subsequent questions
    const questions: Question[] = choices.slice(0, 1).map(({ step, graph: choice }, stepIdx) => {
      const name = step.name || chalk.red("Missing name")
      const { description } = step
      const message =
        chalk.inverse.bold(` Choice ${choiceIter + stepIdx + 1} `) +
        `${step.name ? chalk.bold(` ${step.name} `) : chalk.inverse.red(" Missing name ")}`

      const { content } = step

      // according to the current profile, has this question been
      // previously answered?
      const suggestion = this.memos.suggestions.get(choice)

      // are we dealing with a form? i.e. a set of questions, rather
      // than a singleton question
      const thisChoiceIsAForm = isForm(content)
      const suggestionForm = !thisChoiceIsAForm || !suggestion ? {} : JSON.parse(suggestion)

      // multiselect prior answers?
      const previouslySelectedOptions = !isMultiSelect(content) || !suggestion ? undefined : JSON.parse(suggestion)

      // should we ask the user to answer/re-answer this question? yes
      // if a) we have no suggestion; or b) we were asked to run in
      // interactive mode always, interactive === true; or c) we were
      // asked to run in interactive mode for the last question, and
      // this is the last question
      const askIt = !suggestion || this.options.interactive === true || this.options.ifor === choice.groupContext

      if (!askIt) {
        if (thisChoiceIsAForm) {
          if (suggestionForm && eqSet(new Set(Object.keys(suggestionForm)), new Set(content.map((_) => _.title)))) {
            return {
              type: "AlreadyAnswered",
              name,
              description,
              message,
              answer: suggestion,
            }
          }
        } else if (isMultiSelect(content)) {
          if (!Array.isArray(previouslySelectedOptions)) {
            console.error("Malformatted profile, expected array for " + name)
          } else {
            const allPreviouslySelectedOptionsStillExist = previouslySelectedOptions.every(
              (suggestion) => !!content.find((_) => _.title === suggestion)
            )
            if (allPreviouslySelectedOptionsStillExist) {
              // then we are in non-interactive mode, and found a valid
              // prior choice
              return {
                type: "AlreadyAnswered",
                name,
                description,
                message,
                answer: suggestion,
              }
            }
          }
        } else {
          const suggested = content.find((_) => _.title === suggestion)
          if (suggested) {
            // then we are in non-interactive mode, and found a valid
            // prior choice
            return {
              type: "AlreadyAnswered",
              name,
              description,
              message,
              answer: suggestion,
            }
          }
        }
      }

      const choices = content.map((tile, idx, A) => {
        const isSuggested = suggestion === tile.title

        return {
          name: tile.title,
          initial: thisChoiceIsAForm ? tile.form.defaultValue.toString() : undefined,
          isSuggested,
          message:
            chalk.bold(tile.title) +
            (isSuggested ? this.suggestionHint : "") +
            (!tile.description
              ? ""
              : chalk.reset(EOL) + this.format(tile.description) + (idx < A.length - 1 ? chalk.reset(EOL) : "")),
        }
      })

      if (thisChoiceIsAForm) {
        choices.forEach((_) => {
          const suggestion = suggestionForm[_.name]
          if (suggestion) {
            _.initial = suggestion
          }
        })

        return {
          type: "form" as const,
          name,
          description,
          message,
          choices,
        }
      } else {
        const selChoices = choices as enquirer.prompt.SelectQuestion.ChoiceOptions[]
        selChoices.forEach((_) => {
          //_.hint = suggestion === _.name ? this.suggestionHint : undefined
          if (_.name === "separator") {
            _.name = ""
            _.message = ""
            _.disabled = true
            _.role = "separator"
          }
        })

        // sigh... i can't figure out how to make a choice
        // default-selected; so... instead sort to float the selected
        // to the top
        selChoices.sort((a, b) => (suggestion === a.name ? -1 : suggestion === b.name ? 1 : 0))

        const isMulti = isMultiSelect(content)
        return {
          type: isMulti ? ("multiselect" as const) : ("select" as const),
          name,
          description,
          message:
            message +
            (!isMulti
              ? ""
              : " " + chalk.dim(`(Note: ${`${chalk.bold("space")} selects and ${chalk.bold("enter")} accepts`})`)),
          choices,
          validate: !isMulti ? undefined : (value) => Array.isArray(value) && value.length > 0, // reject no selections for multi
          initial:
            isMulti && Array.isArray(previouslySelectedOptions) ? (previouslySelectedOptions as string[]) : undefined,
        }
      }
    })

    return {
      graph,
      wizard,
      choices,
      preChoiceTasks,
      postChoiceTasks,
      questions,
    }
  }

  private incorporateAnswers(choiceStep: ChoiceStep, answer: string | enquirer.prompt.FormQuestion.Answer) {
    if (typeof answer === "string") {
      this.choices.set(choiceStep.graph, answer)
    } else {
      this.choices.formComplete(choiceStep.graph, answer)
    }
  }

  private isSelect(opts: Question): opts is enquirer.prompt.SelectQuestionOptions {
    return opts.type === "select"
  }

  private isMultiSelect(opts: Question): opts is enquirer.prompt.MultiSelectQuestionOptions {
    return opts.type === "multiselect"
  }

  /** Present the given question to the user */
  private async ask(opts: Question & { description?: string }) {
    if (isAlreadyAnswered(opts)) {
      // Then there is nothing to ask the user, since this question
      // already has an answer, likely by using a previous answer from
      // the current profile. We still want to give some indication of
      // what's going on, though.

      console.log(opts.message + chalk.dim(" · ") + chalk.cyan(opts.answer))
      return opts.answer
    }

    const prompt = this.isSelect(opts)
      ? new enquirer.Select(opts)
      : this.isMultiSelect(opts)
      ? new enquirer.MultiSelect(opts)
      : new enquirer.Form(opts)

    if (this.options.raw) {
      const readline = await import("readline")
      const r1 = readline.createInterface({
        terminal: false,
        input: process.stdin,
        output: process.stdout,
      })

      const answer = await new Promise<string | Record<string, string>>((resolve, reject) => {
        try {
          r1.question(
            this.options.rawPrefix +
              " " +
              JSON.stringify({
                type: "ask",
                ask: {
                  type: prompt.type,
                  name: prompt.name,
                  description: opts.description,
                  initial: prompt.initial,
                  choices: prompt.choices,
                },
              }) +
              "\n",
            (resp) => {
              r1.close()
              try {
                resolve(JSON.parse(resp) as Record<string, string>)
              } catch (err) {
                resolve(resp)
              }
            }
          )
        } catch (err) {
          reject(err)
        }
      })
      return answer
    } else {
      return this.ui.ask(prompt)
    }
  }

  private firstBitOf(msg: string) {
    return msg.slice(0, 50).split(/\n/)[0]
  }

  /** Try to be quiet when executing this task? */
  private beQuietForTaskRunner(block: CodeBlockProps) {
    return !this.options.verbose && (!!isExport(block.body) || /^\s*(echo|cat|mkdir|while|if).+/gm.test(block.body))
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
      quiet: subtasks.every((_) => this.beQuietForTaskRunner(_)),
      task: () =>
        subtasks.map(
          (block): Task => ({
            title: block.validate
              ? chalk.dim("checking to see if this task has already been done\u2026")
              : this.options.verbose
              ? this.ui.code(block.body, block.language)
              : "",
            spinner: !!block.validate,
            quiet: !this.options.verbose,
            task: async (subtask) => {
              let status: Status = statusOf(block, this.memos.statusMemo, this.choices)

              try {
                if (status !== "success" && block.validate) {
                  try {
                    status = await validate(block, this.memos, { throwErrors: dryRun })
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
                      (await shellExec(
                        block.body,
                        this.memos,
                        {
                          write: this.write,
                          dryRun: this.options.dryRun,
                          verbose: this.options.verbose,
                          profile: this.options.profile,
                        },
                        block.language,
                        block.exec,
                        block.async
                      ))

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
      },
      this.write
    )

    this.markDone(0, "success")
    await taskPromise

    return true // we actually ran the tasks
  }

  /** Emit the title and description of the given `graph` */
  private presentGuidebookTitle(graph: Graph) {
    if (this.options.raw) {
      // do not display guidebook title if we are in "raw" mode
      return
    }

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

  /** It may be desired to clear the screen before asking the first question */
  private get shouldClearOnFirstQuestion() {
    return (
      process.env.MWCLEAR_INITIAL ||
      (!this.options.raw && this.options.clear !== false && this.options.interactive && process.env.DEBUG === undefined)
    )
  }

  /** It may be desired to clear the screen between every question */
  private get shouldClearOnEveryQuestion() {
    return process.env.MWCLEAR
  }

  /** Iterate until all choices have been resolved */
  private async resolveChoices(iter = 0, choiceIter = 0, previous?: Wizard) {
    const qs = await this.questions(choiceIter, previous)
    const { graph, choices, preChoiceTasks, postChoiceTasks, questions, wizard } = qs

    if (this.isGuided) {
      if (iter === 0) {
        if (this.shouldClearOnFirstQuestion) {
          // clear the console before presenting the guide, but after
          // the initial compilation, and before presenting the guidebook title
          console.clear()
        }

        this.presentGuidebookTitle(graph)
      } else if (this.shouldClearOnEveryQuestion) {
        console.clear()
      }
    }

    if (questions.length === 0) {
      if (this.options.raw) {
        // notify the client that we are done with the Q&A part
        console.log(this.options.rawPrefix + " " + JSON.stringify({ type: "qa-done" }) + "\n")
      }
      return postChoiceTasks
    } else if (preChoiceTasks.length > 0) {
      await this.runTasks(preChoiceTasks)
      return this.resolveChoices(iter + 1, choiceIter, wizard)
      // ^^^ same choice iter, since we asked no questions this time
    } else if (!this.isGuided) {
      // we have unresolved questions, but were asked to run a non-guided execution :(
      throw new Error(
        `Unable to run this guidebook, due to ${questions.length} unresolved question${
          questions.length === 1 ? "" : "s"
        }`
      )
    } else {
      const firstQuestion = questions[0]

      // note that we ask one question at a time, because the answer
      // to the first question may influence what question we ask next
      await this.incorporateAnswers(choices[0], await this.ask(firstQuestion))
      return this.resolveChoices(iter + 1, choiceIter + 1, wizard)
    }
  }

  public async run() {
    // a name we might want to associate with the run, in the logs
    const name = this.options.name ? ` (${this.options.name})` : ""

    const tasks = await this.resolveChoices()
    try {
      // await this.showPlan(true, true)
      const tasksWereRun = await this.runTasks(tasks)

      if (tasksWereRun && this.isGuided) {
        if (this.options.raw) {
          // notify the client that we are done with the Q&A part
          console.log(
            this.options.rawPrefix +
              " " +
              JSON.stringify({ type: "all-done", success: this.allDoneSuccessfully() }) +
              "\n"
          )
        }

        if (this.allDoneSuccessfully()) {
          console.log()
          console.log("✨ Guidebook successful" + name)
        } else {
          console.log()
          console.log(chalk.red("Guidebook incomplete" + name))
        }
      }
    } catch (err) {
      if (!isEarlyExit(err)) {
        throw new Error(chalk.red(mainSymbols.cross) + " Run failed" + name + ": " + err.message)
      }
    }
  }
}
