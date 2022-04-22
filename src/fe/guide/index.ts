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

  private indent(str: string) {
    return indent(wrap(str, process.stdout.columns - 5), "  ")
  }

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
        ...step.content.map((tile, idx, A) => ({
          value: tile.title,
          short: tile.title,
          name:
            tile.title +
            (!tile.description
              ? ""
              : "\n" + chalk.reset(this.indent(tile.description.trim())) + (idx === A.length - 1 ? "" : "\n")),
        })),
        new inquirer.Separator(),
      ],
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
  }

  private async runTasks(taskSteps: TaskStep[]) {
    this.separator("This guide is now ready for execution", true)

    const answers = await this.prompt([
      {
        type: "list",
        name: "execution",
        message: "Execute now? 🚀",
        choices: ["Cancel", "Yes, run them all unattended 🤖", "Yes, step me through the execution"],
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
              title: block.validate
                ? chalk.yellow("checking to see if this task has already been done\u2026")
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
      const { graph, choiceSteps, taskSteps, questions } = await this.questions()

      if (iter === 0) {
        const title = extractTitle(graph)
        const description = extractDescription(graph)
        if (title) {
          console.log(chalk.bold.underline(title.trim()))
        }
        if (description) {
          console.log(this.indent(chalk.reset(description.trim())))
        }

        if (title || description) {
          console.log()
        }
      }

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
