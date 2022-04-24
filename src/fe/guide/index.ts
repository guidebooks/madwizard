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
import { Listr } from "listr2"
import readline from "readline"
import { Writable } from "stream"
import { EventEmitter } from "events"
import terminalLink from "terminal-link"
import inquirer, { Question, Answers } from "inquirer"

import { ChoiceState } from "../../choices"
import { CodeBlockProps } from "../../codeblock"
import indent from "../../parser/markdown/util/indent"
import { wizardify, ChoiceStep, TaskStep, isChoiceStep, isTaskStep } from "../../wizard"
import { blocks, compile, extractTitle, extractDescription, shellExec, validate } from "../../graph"

export class Guide {
  private readonly debug = Debug("madwizard/fe/guide")

  public constructor(
    private readonly blocks: CodeBlockProps[],
    private readonly choices: ChoiceState,
    private readonly prompt = inquirer.createPromptModule()
  ) {}

  private indent(str: string, indentation = "  ") {
    return indent(str, indentation)
  }

  private questions() {
    const graph = compile(this.blocks, this.choices)
    const steps = wizardify(graph)

    const choiceSteps = steps.filter(isChoiceStep)
    const taskSteps = steps.filter(isTaskStep)

    const questions = choiceSteps.map(({ step }, stepIdx) => ({
      type: "list",
      pageSize: 20,
      name: step.name,
      message: chalk.underline(`Choice ${stepIdx + 1}:` + ` ${step.name}`),
      choices: step.content.map((tile, idx, A) => ({
        value: tile.title,
        short: tile.title,
        name:
          chalk.bold(tile.title) +
          (!tile.description
            ? ""
            : "\n" + this.linkify(this.indent(tile.description.trim())) + (idx === A.length - 1 ? "" : EOL)),
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

  private listrTaskStep({ step, graph }: TaskStep, taskIdx: number, dryRun: boolean) {
    return {
      title: step.name,
      task: (ctx, task) =>
        task.newListr(
          blocks(graph).flatMap((block) => ({
            title: block.validate
              ? chalk.dim("checking to see if this task has already been done\u2026")
              : chalk[taskIdx === 1 ? "reset" : "dim"].magenta(block.body),
            // options: { persistentOutput: true },
            task: async (_, task) => {
              if (block.validate) {
                try {
                  await validate(block)
                  task.skip()
                  return
                } catch (err) {
                  this.debug("Validation error", err)
                }
              }

              try {
                if (!dryRun) {
                  await this.waitTillDone(taskIdx - 1)
                  task.title = chalk.magenta(block.body)
                  await shellExec(block.body, task.stdout())
                }
              } finally {
                task.title = chalk.magenta(block.body)
                this.markDone(taskIdx)
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
          this.markDone(taskIdx)
        },
      },
    ]
  }

  private readonly done: boolean[] = []
  private readonly doneEvents = new EventEmitter()
  private markDone(taskIdx: number) {
    this.done[taskIdx] = true
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

  private async runTasks(taskSteps: TaskStep[]) {
    const { execution } = await this.prompt([
      {
        type: "list",
        name: "execution",
        message: "How do you wish to execute this guidebook?",
        choices: [
          { value: "dryr", name: "Dry run" },
          { value: "auto", name: "Run unattended 🤖" },
          { value: "step", name: "Stepped execution" },
          { value: "stop", name: "Cancel" },
        ],
      },
    ])

    if (execution === "stop") {
      return
    } else if (execution === "step") {
      console.log("🖐  Hit enter after every step to proceed to the next step, or ctrl+c to cancel.")
      console.log()
    }

    const stepIt = execution === "step"

    const taskPromise = new Listr(
      taskSteps.flatMap((_, idx, A) => [
        this.listrTaskStep(_, stepIt ? idx * 2 + 1 : idx + 1, execution === "dryr"),
        ...(stepIt && idx < A.length - 1 ? this.listrPauseStep(idx * 2 + 2) : []),
      ]),
      {
        /* options */
        concurrent: true,
      }
    ).run()

    this.markDone(0)
    await taskPromise
  }

  private linkify(str: string) {
    return str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, p1, p2) => terminalLink(p1, p2))
  }

  /** Iterate until all choices have been resolved */
  private async resolveChoices(iter = 0) {
    const { graph, choiceSteps, taskSteps, questions } = await this.questions()

    if (iter === 0) {
      const title = extractTitle(graph)
      const description = extractDescription(graph)
      if (title) {
        console.log("📖 " + chalk.bold.blue(title.trim()))
      }
      if (description) {
        console.log(this.linkify(this.indent(description.trim(), "   ")))
      }

      if (title || description) {
        console.log()
      }
    }

    if (questions.length === 0) {
      return taskSteps
    } else {
      await this.incorporateAnswers(choiceSteps, await this.ask(questions))
      return this.resolveChoices(iter + 1)
    }
  }

  public async run() {
    console.clear()
    const taskSteps = await this.resolveChoices()
    await this.runTasks(taskSteps)
  }
}
