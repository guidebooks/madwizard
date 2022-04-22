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
import chalk from "chalk"
import wrap from "wrap-ansi"
import { Listr } from "listr2"
import readline from "readline"
import { Writable } from "stream"
import inquirer, { Question, Answers } from "inquirer"

import { ChoiceState } from "../../choices"
import { CodeBlockProps } from "../../codeblock"
import indent from "../../parser/markdown/util/indent"
import { wizardify, ChoiceStep, TaskStep, isChoiceStep, isTaskStep } from "../../wizard"
import { blocks, compile, extractTitle, extractDescription, /* shellExec, */ validate } from "../../graph"

export class Guide {
  private readonly debug = Debug("madwizard/fe/guide")

  public constructor(
    private readonly blocks: CodeBlockProps[],
    private readonly choices: ChoiceState,
    private readonly prompt = inquirer.createPromptModule()
  ) {}

  private wrap(str: string) {
    return wrap(str, process.stdout.columns - 10)
  }

  private indent(str: string, indentation = "  ") {
    return indent(this.wrap(str), indentation)
  }

  private questions() {
    const graph = compile(this.blocks, this.choices)
    const steps = wizardify(graph, this.choices)

    const choiceSteps = steps.filter(isChoiceStep)
    const taskSteps = steps.filter(isTaskStep)

    const questions = choiceSteps.map(({ step }, stepIdx) => ({
      type: "list",
      pageSize: 20,
      name: step.name,
      message: chalk.yellow(`Choice ${stepIdx + 1}:`) + ` ${step.name}`,
      choices: step.content.map((tile, idx, A) => ({
        value: tile.title,
        short: tile.title,
        name:
          chalk.bold(tile.title) +
          (!tile.description
            ? ""
            : "\n" + chalk.reset(this.indent(tile.description.trim())) + (idx === A.length - 1 ? "" : "\n")),
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

  private ask(questions: Question[], iter = 0) {
    if (questions.length > 0) {
      if (iter === 0) {
        // console.log(this.separator("Your Choices"))
      }
      return this.prompt(questions)
    }
  }

  private separator(title?: string) {
    return chalk.yellow(title)
  }

  private listrTaskStep({ step, graph }: TaskStep) {
    return {
      title: step.name,
      task: (ctx, task) =>
        task.newListr(
          blocks(graph).flatMap((block) => ({
            title: block.validate
              ? chalk.dim("checking to see if this task has already been done\u2026")
              : chalk.magenta(block.body),
            task: async () => {
              if (block.validate) {
                try {
                  await validate(block)
                  task.skip()
                  return
                } catch (err) {
                  this.debug("Validation error", err)
                }
              }

              // await shellExec(block.body)
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

  private listrPauseStep() {
    return [{ task: this.waitForEnter }]
  }

  private async runTasks(taskSteps: TaskStep[]) {
    const { execution } = await this.prompt([
      {
        type: "list",
        name: "execution",
        message: this.separator("Guidebook is now ready for execution"),
        choices: [
          { value: "auto", name: "Run unattended 🤖" },
          { value: "step", name: "Step me through it 🐌" },
          { value: "stop", name: "Cancel 🛑" },
        ],
      },
    ])

    if (execution === "stop") {
      return
    } else if (execution === "step") {
      console.log("🖐  Hit enter after every step to proceed to the next step, or ctrl+c to cancel.")
      console.log()
    }

    await new Listr(
      taskSteps.flatMap((_, idx, A) => [
        this.listrTaskStep(_),
        ...(execution === "step" && idx < A.length - 1 ? this.listrPauseStep() : []),
      ]),
      {
        /* options */
        concurrent: false,
      }
    ).run()
  }

  /** Iterate until all choices have been resolved */
  private async resolveChoices(iter = 0) {
    const { graph, choiceSteps, taskSteps, questions } = await this.questions()

    if (iter === 0) {
      const title = extractTitle(graph)
      const description = extractDescription(graph)
      if (title) {
        console.log("📖 " + chalk.bold.blue.underline(title.trim()))
      }
      if (description) {
        console.log(this.indent(description.trim(), "   "))
      }

      if (title || description) {
        console.log()
      }
    }

    if (questions.length === 0) {
      return taskSteps
    } else {
      await this.incorporateAnswers(choiceSteps, await this.ask(questions, iter))
      return this.resolveChoices(iter + 1)
    }
  }

  public async run() {
    const taskSteps = await this.resolveChoices()
    console.log()
    await this.runTasks(taskSteps)
  }
}
