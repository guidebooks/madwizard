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

import chalk from "chalk"
import wrap from "wrap-ansi"
import { Listr } from "listr2"
import inquirer, { Question, Answers } from "inquirer"

import { ChoiceState } from "../../choices"
import { blocks, compile /*, shellExec */ } from "../../graph"
import { CodeBlockProps } from "../../codeblock"
import indent from "../../parser/markdown/util/indent"
import { wizardify, ChoiceStep, TaskStep, isChoiceStep, isTaskStep } from "../../wizard"

export class Guide {
  public constructor(
    private readonly blocks: CodeBlockProps[],
    private readonly choices: ChoiceState,
    private readonly prompt = inquirer.createPromptModule()
  ) {}

  private questions() {
    const graph = compile(this.blocks, this.choices)
    const steps = wizardify(graph, this.choices)

    const choiceSteps = steps.filter(isChoiceStep)
    const taskSteps = steps.filter(isTaskStep)

    const questions = choiceSteps.map(({ step }) => ({
      type: "list",
      pageSize: 20,
      name: step.name,
      message: step.name,
      choices: [
        new inquirer.Separator(),
        ...step.content.map((tile) => ({
          value: tile.title,
          short: tile.title,
          name: tile.title + (!tile.description ? "" : "\n" + chalk.dim(indent(wrap(tile.description, 80), "  "))),
        })),
        new inquirer.Separator(),
      ],
    }))

    return {
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
        this.separator("Your Choices")
      }
      return this.prompt(questions)
    }
  }

  private separator(title = "", extra = false) {
    if (extra) {
      console.log()
    }
    console.log(chalk.yellow(title))
    // console.log(chalk.dim(new Array(40).fill('──').join('')))
  }

  private async runTasks(taskSteps: TaskStep[]) {
    this.separator("This guide is now ready for execution", true)

    const answers = await this.prompt([
      {
        type: "list",
        name: "execution",
        message: "Execute now? 🚀",
        choices: ["Cancel", "Yes, run them all unattended", "Yes, step me through the execution"],
      },
    ])

    if (answers.execution === "Cancel") {
      return
    }

    await new Listr(
      taskSteps.map(({ step, graph }) => ({
        title: step.name,
        task: (ctx, task) =>
          task.newListr(
            blocks(graph).map((block) => ({
              title: chalk.magenta(block.body),
              task: async () => {
                await new Promise((resolve) => setTimeout(resolve, 2000))
                // await shellExec(block.body)
              },
            }))
          ),
      })),
      {
        /* options */
        concurrent: false,
      }
    ).run()
  }

  public async run() {
    let done = false
    let iter = 0
    while (!done) {
      const { choiceSteps, taskSteps, questions } = await this.questions()
      if (questions.length === 0) {
        await this.runTasks(taskSteps)
        done = true
      } else {
        await this.incorporateAnswers(choiceSteps, await this.ask(questions, iter))
      }
      iter++
    }
  }
}
