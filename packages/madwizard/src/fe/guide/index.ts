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
import { Chalk } from "chalk"
import enquirer from "enquirer"
import { Writable } from "stream"
import { mainSymbols } from "figures"
import { EventEmitter } from "events"

import TaskRunner, { Task } from "./taskrunner.js"

import isRaw from "../raw/index.js"
import { eqSet } from "../../util/set.js"
import { MadWizardOptions } from "../../index.js"
import { ChoiceState } from "../../choices/index.js"
import { isEarlyExit } from "../../exec/EarlyExit.js"
import { CodeBlockProps } from "../../codeblock/index.js"
import { shellExec, isExport } from "../../exec/index.js"
import { isFinallyPop } from "../../exec/finally/exec.js"
import indent from "../../parser/markdown/util/indent.js"
import { Memos, statusOf } from "../../memoization/index.js"
import { UI, AnsiUI, prettyPrintUITreeFromBlocks } from "../tree/index.js"
import {
  Graph,
  SubTask,
  Status,
  blocks,
  compile,
  extractTitle,
  extractDescription,
  validate,
} from "../../graph/index.js"
import optimize from "../../graph/optimize.js"

import {
  ChoiceStep,
  TaskStep,
  FinallyTaskStep,
  Wizard,
  isChoiceStep,
  isForm,
  isMultiSelect,
  isTaskStep,
  isNormalTaskStep,
  isFinallyTaskStep,
  asNormalTaskStep,
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
    private readonly write?: Writable["write"],
    private readonly chalk = options.stdio ? new Chalk({ level: 2 }) : new Chalk()
  ) {}

  private exitSignalFromUser?: Parameters<Memos["cleanup"]>[0]
  public async onExitSignalFromUser(signal?: Parameters<Memos["cleanup"]>[0]) {
    this.exitSignalFromUser = signal

    if (this._currentRunner) {
      this._currentRunner.kill()
    }

    await this.runOnStackFinallies()
  }

  private get hasReceivedExitSignalFromUser() {
    return !!this.exitSignalFromUser
  }

  private get isGuided() {
    return this.task === "guide"
  }

  private format(str: string, indentation = "  ") {
    return indent(this.ui.markdown(str.trim()), indentation)
  }

  private get suggestionHint() {
    // reset the underlining from enquirer
    return this.chalk.reset.yellow.dim("  ◄ prior choice")
  }

  /** Map from `isFinallyFor` to associated finally `TaskStep` */
  private _finallies: Record<SubTask["isFinallyFor"], FinallyTaskStep> = {}

  /** Current list of known finally tasks */
  private get finallies(): FinallyTaskStep[] {
    return Object.values(this._finallies)
  }

  /** Run any on-stack finallies */
  private async runOnStackFinallies() {
    await this.runFinallyTasks(
      this.finallies.filter((_) => this.memos.finallyStack.includes(_.graph.isFinallyFor)).reverse()
    )
  }

  /** Remember any finally blocks that we may want to execute on abnormal termination */
  private setFinallies(steps: FinallyTaskStep[]) {
    steps.forEach((_) => (this._finallies[_.graph.isFinallyFor] = _))
    return steps
  }

  /** Disremember ... from `setFinallies` */
  private async clearFinallies(finallies: FinallyTaskStep[]) {
    finallies.forEach((_) => delete this._finallies[_.graph.isFinallyFor])
  }

  /**
   * Execute any finally blocks associated with the given finally
   * block context (this comes from an `isFinallyFor` property of a
   * `SubTask`.
   */
  private async execAndClearFinally(ctx: string) {
    const finallySteps = this.finallies.filter((_) => _.graph.isFinallyFor === ctx)
    await this.runFinallyTasks(finallySteps)
    this.clearFinallies(finallySteps)
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
      const name = step.name || this.chalk.red("Missing name")
      const { description } = step
      const message =
        this.chalk.inverse.bold(` Choice ${choiceIter + stepIdx + 1} `) +
        `${step.name ? this.chalk.bold(` ${step.name} `) : this.chalk.inverse.red(" Missing name ")}`

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

      const choices = content.map((tile) => {
        const isSuggested = suggestion === tile.title

        return {
          name: tile.title,
          initial: thisChoiceIsAForm ? tile.form.defaultValue.toString() : undefined,
          isSuggested,
          message:
            this.chalk.bold(tile.title) +
            (isSuggested ? this.suggestionHint : "") +
            (!tile.description ? "" : this.chalk.reset(EOL) + this.format(tile.description) + this.chalk.reset(EOL)),
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
              : " " +
                this.chalk.dim(
                  `(Note: ${`${this.chalk.bold("space")} selects and ${this.chalk.bold("enter")} accepts`})`
                )),
          choices,
          validate: !isMulti ? undefined : (value) => Array.isArray(value) && value.length > 0, // reject no selections for multi
          initial:
            isMulti && Array.isArray(previouslySelectedOptions)
              ? (previouslySelectedOptions as string[]).filter(
                  // filter out previously selected options that no longer exist in the latest guidebook
                  (suggestion) => !!content.find((_) => _.title === suggestion)
                )
              : undefined,
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

  private incorporateAnswers(choiceStep: ChoiceStep, answer: string | string[] | enquirer.prompt.FormQuestion.Answer) {
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

  private async echo() {
    return new (await import("./EchoStream.js")).default()
  }

  private async echoWrite() {
    const echo = await this.echo()
    return echo.write.bind(echo)
  }

  private consoleLog(msg?: string) {
    if (this.options.stdio?.stdout) {
      this.options.stdio.stdout.write((msg || "") + "\n")
    } else if (msg) {
      console.log(msg)
    } else {
      console.log()
    }
  }

  /** Present the given question to the user */
  private async ask(opts: Question & { description?: string }) {
    if (isAlreadyAnswered(opts)) {
      // Then there is nothing to ask the user, since this question
      // already has an answer, likely by using a previous answer from
      // the current profile. We still want to give some indication of
      // what's going on, though.

      this.consoleLog(opts.message + this.chalk.dim(" · ") + this.chalk.cyan(opts.answer))
      return opts.answer
    }

    const withStdout = async <T extends Question>(opts: T) => {
      const stdin = this.options.stdio?.stdin
      const stdout = this.options.stdio?.stdout || (isRaw(this.options) ? await this.echo() : undefined)
      const o: T & { stdin?: NodeJS.ReadableStream; stdout?: NodeJS.WritableStream } = Object.assign({}, opts)
      if (stdin) {
        o.stdin = stdin
      }
      if (stdout) {
        o.stdout = stdout
      }
      return o
    }

    const prompt = this.isSelect(opts)
      ? new enquirer.Select(await withStdout(opts))
      : this.isMultiSelect(opts)
      ? new enquirer.MultiSelect(await withStdout(opts))
      : new enquirer.Form(await withStdout(opts))

    if (isRaw(this.options)) {
      const { ask } = await import("../raw/ask.js")
      return ask(prompt, opts.description, this.options)
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
        : (dryRun ? this.chalk.yellow(mainSymbols.questionMarkPrefix) : this.chalk.green(mainSymbols.play)) +
          " " +
          step.name,
      quiet: subtasks.every((_) => this.beQuietForTaskRunner(_)),
      task: () =>
        subtasks.map(
          (block): Task => ({
            title: block.validate
              ? this.chalk.dim("checking to see if this task has already been done\u2026")
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
                      subtask.fail(dryRun ? "NOT READY" : undefined, undefined, dryRun ? this.chalk.yellow : undefined)
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

                    const popContext = isFinallyPop(block.body, block.exec)
                    if (popContext) {
                      await this.execAndClearFinally(popContext)
                      status = "success"
                    } else {
                      status =
                        (this.memos.statusMemo && this.memos.statusMemo[statusMemoKey] === "success" && "success") ||
                        (await shellExec(
                          block.body,
                          this.memos,
                          {
                            write: this.write,
                            shell: this.options.shell,
                            dryRun: this.options.dryRun,
                            verbose: this.options.verbose,
                            profile: this.options.profile,
                          },
                          block.language,
                          block.exec,
                          block.async
                        ))
                    }

                    if (status == "success" && this.memos.statusMemo) {
                      this.memos.statusMemo[statusMemoKey] = status
                    }
                  }
                } catch (err) {
                  status = "error"
                  throw err
                } finally {
                  // subtask.title = this.chalk.magenta(block.body)
                }
              } finally {
                markDone(status)
              }
            },
          })
        ),
    }
  }

  private async waitForEnter() {
    const mutedStdout = new Writable({
      write: function (chunk, encoding, callback) {
        callback()
      },
    })

    const { default: readline } = await import("readline")
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
      { skipFirstTitle, /* indent: "  ",*/ narrow, root: this.chalk.blue.bold("The Plan") }
    )

    this.consoleLog()
  }

  /** @return whether we actually ran them */
  private _currentRunner: TaskRunner
  private async runTasks(taskSteps: TaskStep[], execution: "auto" | "step" | "dryr" = "auto"): Promise<boolean> {
    if (taskSteps.length === 0) {
      return false
    }

    if (execution === "step") {
      this.consoleLog("🖐  Hit enter after every step to proceed to the next step, or ctrl+c to cancel.")
      this.consoleLog()
    }

    const stepIt = execution === "step"
    const dryRun = execution === "dryr"

    const runner = new TaskRunner()
    this._currentRunner = runner // ugh, to help with ctrl+c handling

    const taskPromise = runner.run(
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
      this.write || (await this.echoWrite())
    )

    this.markDone(0, "success")
    await taskPromise
    this._currentRunner = undefined

    return true // we actually ran the tasks
  }

  private async runFinallyTasks(taskSteps: FinallyTaskStep[]) {
    try {
      return await this.runTasks(
        await Promise.all(
          taskSteps.map(asNormalTaskStep).map(async (_) =>
            Object.assign({}, _, {
              graph: await optimize(_.graph, this.choices, this.memos, this.options),
            })
          )
        )
      )
    } catch (err) {
      console.error("Error running finally tasks", err)
      throw err
    }
  }

  /** Emit the title and description of the given `graph` */
  private presentGuidebookTitle(graph: Graph) {
    if (isRaw(this.options)) {
      // do not display guidebook title if we are in "raw" mode
      return
    }

    const title = extractTitle(graph)
    const description = extractDescription(graph)
    if (title) {
      this.consoleLog(this.chalk.inverse.bold(` ${title.trim()} `))
    }
    if (description) {
      this.consoleLog(this.format(description))
    }

    if (title || description) {
      this.consoleLog()
    }
  }

  /** It may be desired to clear the screen before asking the first question */
  private get shouldClearOnFirstQuestion() {
    return (
      process.env.MWCLEAR_INITIAL ||
      (!isRaw(this.options) &&
        this.options.clear !== false &&
        this.options.interactive &&
        process.env.DEBUG === undefined)
    )
  }

  /** It may be desired to clear the screen between every question */
  private get shouldClearOnEveryQuestion() {
    return process.env.MWCLEAR
  }

  /** Iterate until all choices have been resolved */
  private async resolveChoices(iter = 0, choiceIter = 0, previous?: Wizard): Promise<void> {
    const qs = await this.questions(choiceIter, previous)
    const { graph, choices, preChoiceTasks: pre, postChoiceTasks: post, questions, wizard } = qs

    if (this.hasReceivedExitSignalFromUser) {
      return
    }

    const finallySteps = [...pre, ...post].filter(isFinallyTaskStep)
    this.setFinallies(finallySteps)

    const preChoiceTasks = pre.filter(isNormalTaskStep)
    const postChoiceTasks = post.filter(isNormalTaskStep)

    try {
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
        if (isRaw(this.options)) {
          // notify the client that we are done with the Q&A part
          const { qadone } = await import("../raw/qadone.js")
          await qadone(this.options)
        }
        await this.runTasks(await postChoiceTasks)
      } else if (preChoiceTasks.length > 0) {
        await this.runTasks(preChoiceTasks)
        return await this.resolveChoices(iter + 1, choiceIter, wizard)
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
        return await this.resolveChoices(iter + 1, choiceIter + 1, wizard)
      }
    } finally {
      // this shouldn't be necessary, in the absence of bugs;
      // popContext should clear as they come
      await this.clearFinallies(finallySteps)
    }
  }

  public async run() {
    // a name we might want to associate with the run, in the logs
    const name = this.options.name ? ` (${this.options.name})` : ""

    try {
      await this.resolveChoices()

      // await this.showPlan(true, true)
      if (this.isGuided) {
        if (isRaw(this.options)) {
          // notify the client that we are done with the Q&A part
          const { alldone } = await import("../raw/alldone.js")
          await alldone(this.options, this.allDoneSuccessfully())
        }

        if (this.allDoneSuccessfully()) {
          this.consoleLog()
          this.consoleLog("✨ Guidebook successful" + name)
        } else {
          this.consoleLog()
          this.consoleLog(this.chalk.red("Guidebook incomplete" + name))
        }
      }
    } catch (err) {
      if (!isEarlyExit(err) && !this.hasReceivedExitSignalFromUser) {
        if (this.options.raw) {
          throw err
        } else {
          throw new Error(this.chalk.red(mainSymbols.cross) + " Run failed" + name + ": " + err.message)
        }
      }
    }
  }
}
