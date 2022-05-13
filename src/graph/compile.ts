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
import { CodeBlockProps } from "../codeblock"
import { ChoiceState, expand } from "../choices"
import { Choice, Graph, SubTask, TitledSteps, emptySequence, extractTitle, parallel, seq, sequence, subtask } from "."

import { Memos } from "../memoization"
import { ValidateOptions } from "./validate"

import {
  Import as CodeBlockImport,
  Choice as CodeBlockChoice,
  WizardStep as CodeBlockWizardStep,
  isChoice as isCodeBlockChoice,
  isImport as isCodeBlockImport,
  isWizardStep as isCodeBlockWizardStep,
} from "../codeblock/CodeBlockProps"

import optimize from "./optimize"
import provenanceOf from "./provenance"

type ChoiceNesting = { parent: CodeBlockChoice; graph: Choice }
type SubTaskNesting = { parent: CodeBlockImport; graph: SubTask }
type WizardStepNesting = { parent: CodeBlockWizardStep; graph: TitledSteps }
type Nesting = ChoiceNesting | SubTaskNesting | WizardStepNesting

/* function isGroupMemberNesting(nesting: Nesting): nesting is ChoiceNesting | WizardStepNesting {
  return isGroupMember(nesting.parent)
} */

function isChoiceNesting(nesting: Nesting): nesting is ChoiceNesting {
  return isCodeBlockChoice(nesting.parent)
}

function isImportNesting(nesting: Nesting): nesting is SubTaskNesting {
  return isCodeBlockImport(nesting.parent)
}

function isWizardStepNesting(nesting: Nesting): nesting is WizardStepNesting {
  return isCodeBlockWizardStep(nesting.parent)
}

export interface CompilerOptions {
  /**
   * Ignore/veto any a priori choices that madwizard might think of as
   * truth, and thus not needing user input. By vetoing one of these a
   * prioris, users will be prompted to redo this choice.
   */
  veto: Set<string>

  /**
   * Should we expand choice groups with dynamic expansion?
   * [default: true]
   */
  expand?: boolean

  /** Selectively enable/disable optimizations */
  optimize:
    | boolean
    | {
        /**
         * Should we optimize away choices against known a priori
         * truths, e.g. user's platform? [default: true]
         */
        aprioris?: boolean

        /**
         * Should we optimize away subgraphs of the plan known to be
         * valid (using the `validate` attributes given by the
         * source)? [default: true]
         */
        validate?: boolean
      }
}

export type CompileOptions = Partial<CompilerOptions> & ValidateOptions & Partial<Memos>

/** Take a list of code blocks and arrange them into a control flow dag */
export async function compile(
  blocks: CodeBlockProps[],
  choices: ChoiceState,
  options: CompileOptions = {},
  ordering: "sequence" | "parallel" = "sequence",
  title?: string,
  description?: string
): Promise<Graph> {
  const debug = Debug("madwizard/timing/graph:compile")
  debug("start")

  try {
    if (!blocks) {
      return undefined
    }

    const parts: Graph[] = []
    let currentNesting: Nesting[] = []

    /** Find the nearest enclosing Import */
    const currentProvenance = () => {
      const provs = currentNesting
        .map((_) => (isImportNesting(_) ? _.parent.provenance || provenanceOf(_.graph) : undefined))
        .filter(Boolean)
      if (provs.length === 0) {
        return undefined
      } else {
        return [provs[provs.length - 1]]
      }
    }

    const newChoice = (block: CodeBlockProps, parent: CodeBlockChoice, isDeepest: boolean) => ({
      member: parent.member,
      graph: isDeepest ? seq(block) : emptySequence(),
      title: parent.title,
      description: parent.description,
    })

    const newChoices = (block: CodeBlockProps, parent: CodeBlockChoice, isDeepest: boolean): Choice => ({
      group: parent.group,
      title: parent.groupDetail.title,
      source: parent.groupDetail.source,
      provenance: currentProvenance(),
      choices: [newChoice(block, parent, isDeepest)],
    })

    const newWizardStep = (
      block: CodeBlockProps,
      parent: CodeBlockWizardStep,
      isDeepest: boolean
    ): TitledSteps["steps"][0] => {
      return {
        title: parent.title,
        description: parent.description,
        source: parent.source,
        graph: isDeepest ? seq(block) : emptySequence(),
      }
    }

    const addToCurrentWizardStep = (
      wiz: TitledSteps,
      block: CodeBlockProps,
      parent: CodeBlockWizardStep,
      isDeepest: boolean
    ): TitledSteps => {
      if (isDeepest) {
        wiz.steps[wiz.steps.length - 1].graph.sequence.push(block)
      }
      return wiz
    }

    const addWizardStep = (
      wiz: TitledSteps,
      block: CodeBlockProps,
      parent: CodeBlockWizardStep,
      isDeepest: boolean
    ): TitledSteps => {
      wiz.steps.push(newWizardStep(block, parent, isDeepest))
      return wiz
    }

    const newWizard = (block: CodeBlockProps, parent: CodeBlockWizardStep, isDeepest: boolean): TitledSteps => {
      const wiz = {
        source: parent.source,
        title: parent.wizard.title,
        description: parent.wizard.description,
        steps: [],
      }
      return addWizardStep(wiz, block, parent, isDeepest)
    }

    const newSubTask = (block: CodeBlockProps, parent: CodeBlockImport, isDeepest: boolean): SubTask => {
      return subtask(
        parent.key,
        parent.title,
        parent.description,
        parent.filepath,
        isDeepest ? seq(block) : emptySequence(),
        parent.source,
        parent.barrier,
        parent.validate
      )
    }

    const set = (idx: number, nestingFn: () => Nesting) => {
      currentNesting = currentNesting.slice(0, idx)

      // important: get the nesting *after* having updated the
      // `currentNesting` tree model. e.g. this is needed so that
      // `currentProvenance` makes sense
      const nesting = nestingFn()
      currentNesting.push(nesting)

      if (idx === 0) {
        parts.push(nesting.graph)
      } else {
        const parent = currentNesting[idx - 1]
        if (isChoiceNesting(parent)) {
          parent.graph.choices[parent.graph.choices.length - 1].graph.sequence.push(nesting.graph)
        } else if (isWizardStepNesting(parent)) {
          parent.graph.steps[parent.graph.steps.length - 1].graph.sequence.push(nesting.graph)
        } else {
          parent.graph.graph.sequence.push(nesting.graph)
        }
      }
    }

    blocks.forEach((block) => {
      if (!block.nesting) {
        parts.push(block)
      } else {
        block.nesting.forEach((parent, idx) => {
          const isDeepest = idx === block.nesting.length - 1
          const curNesting = currentNesting[idx]

          // expect >=3^2 combinations
          // [1] parent is Choice, current nesting is Choice
          //   [1a] same group and member; add to the current choice graph
          //   [1b] same group different member; add a new choice member node
          //   [1c] different group; create new choice node
          // [2] [3] parent is Choice, current nesting is WizardStep or Import
          //    *: create new Choice node
          // [4] parent is WizardStep, current nesting is WizardStep
          //   [4a] same wizard, same step; add to its graph
          //   [4b] same wizard, different step; create new step node
          //   [4c] different wizard
          // [5] [6] parent is WizardStep, current nesting is Choice or Import
          //    *: create new WizardStep node
          // [7] parent is Import, current nesting is Import
          //   [7a] same import; add to current Import graph
          //   [7b] different import; create new import node
          // [8] [9] parent is Import, current nesting is Choice or WizardStep
          //    *: create new Import node
          if (curNesting) {
            if (isCodeBlockChoice(parent)) {
              if (isChoiceNesting(curNesting)) {
                // here we are at [1]
                if (curNesting.parent.group === parent.group) {
                  if (curNesting.parent.member === parent.member) {
                    // here we are at [1a]
                    if (isDeepest) {
                      curNesting.graph.choices[curNesting.graph.choices.length - 1].graph.sequence.push(block)
                    }
                  } else {
                    // here we are at [1b]
                    currentNesting = [...currentNesting.slice(0, idx), { parent, graph: curNesting.graph }]
                    curNesting.graph.choices.push(newChoice(block, parent, isDeepest))
                  }
                } else {
                  // here we are at [1c]
                  set(idx, () => ({ parent, graph: newChoices(block, parent, isDeepest) }))
                }
              } else {
                // here we are at [2] and [3]
                set(idx, () => ({ parent, graph: newChoices(block, parent, isDeepest) }))
              }
            } else if (isCodeBlockWizardStep(parent)) {
              // here we are at [4]
              if (isWizardStepNesting(curNesting)) {
                if (curNesting.parent.group === parent.group) {
                  if (curNesting.parent.member === parent.member) {
                    // here we are at [4a]
                    addToCurrentWizardStep(curNesting.graph, block, parent, isDeepest)
                  } else {
                    // here we are at [4b]
                    currentNesting = [...currentNesting.slice(0, idx), { parent, graph: curNesting.graph }]
                    addWizardStep(curNesting.graph, block, parent, isDeepest)
                  }
                } else {
                  // here we are at [4c]
                  set(idx, () => ({ parent, graph: newWizard(block, parent, isDeepest) }))
                }
              } else {
                // here we are at [5] and [6]
                set(idx, () => ({ parent, graph: newWizard(block, parent, isDeepest) }))
              }
            } else if (isImportNesting(curNesting)) {
              // here we are at [7]
              if (curNesting.parent.key === parent.key) {
                // here we are at [7a]
                if (isDeepest) {
                  curNesting.graph.graph.sequence.push(block)
                }
              } else {
                // here we are at [7b]
                set(idx, () => ({ parent, graph: newSubTask(block, parent, isDeepest) }))
              }
            } else {
              // here we are at [8] and [9]
              set(idx, () => ({ parent, graph: newSubTask(block, parent, isDeepest) }))
            }
          } else {
            // no graph node yet for this nesting depth
            if (isCodeBlockChoice(parent)) {
              // new graph node for choice
              set(idx, () => ({ parent, graph: newChoices(block, parent, isDeepest) }))
            } else if (isCodeBlockWizardStep(parent)) {
              // new graph node for wizard
              set(idx, () => ({ parent, graph: newWizard(block, parent, isDeepest) }))
            } else if (isCodeBlockImport(parent)) {
              // new graph node for import
              set(idx, () => ({ parent, graph: newSubTask(block, parent, isDeepest) }))
            } else {
              console.error("Missing handler in graph compilation", parent)
            }
          }
        })
      }
    })
    debug("graph formation done")

    const doExpand: (...params: Parameters<typeof expand>) => Graph | Promise<Graph> =
      options.expand === false ? (x) => x : expand

    const unoptimized =
      parts.length === 0
        ? undefined
        : await doExpand(
            parts.length === 1 ? parts[0] : ordering === "parallel" ? parallel(parts) : sequence(parts),
            options
          )

    debug("optimizing")
    const optimized = options.optimize === false ? unoptimized : await optimize(unoptimized, choices, options)
    debug("optimizing done")

    if (title && !extractTitle(optimized)) {
      return subtask(title, title, description, "", sequence([optimized]))
    } else {
      return optimized
    }
  } finally {
    debug("complete")
  }
}
