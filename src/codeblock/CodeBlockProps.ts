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

export interface Validatable {
  /**
   * If given, this command line will be executed. If it exits with
   * exit code 0, then the code block will be seen as "already
   * executed", and thus represent a valid state. Non-zero exit
   * codes will not be seen as errors, but rather as representative
   * of a default state.
   */
  validate: string | boolean | number
}

export interface GroupMember {
  /**
   * This option names the group, to keep it distinct from other
   * groups of choices.
   */
  group: string

  /**
   * This option names that member. e.g. if the user can choose
   * between doing either A-and-B or C-and-D, this identifies
   * whether we are part ofth e first choice (A+B) or the second
   * (C+D).
   */
  member: number
}

export interface Title {
  title: string
}

export interface Description {
  description: string
}

export type Source = {
  source: () => string
}

/**
 * Is this a member of a group of choices? e.g. am I `A` in a choice
 * to do either `A+B` or `C+D`?
 */
export type Choice = GroupMember &
  Source &
  Title &
  Partial<Description> &
  Kind<"Choice"> & {
    /** Title and Source for the choice group */
    groupDetail: Partial<Title> & Source
  }

/**
 * Does this guidebook need to be executed before subsequent choices
 * even make sense? e.g. logging in to a cluster.
 */
export interface Barrier {
  barrier?: boolean
}

export type Import = Source &
  Title &
  Partial<Description> &
  Partial<Barrier> &
  Partial<Validatable> &
  Kind<"Import"> & {
    key: string
    filepath: string
  }

type Kind<T extends string> = {
  kind: T
}

export type Wizard = {
  wizard: Title & Partial<Description> & Source
}

export type WizardStep = Wizard & GroupMember & Title & Partial<Description> & Kind<"WizardStep"> & Source

type CodeBlockNestingParent = Choice | Import | WizardStep

export function isGroupMember<T extends CodeBlockNestingParent>(part: T): part is T & GroupMember {
  const member = part as GroupMember
  return typeof member.group === "string" && typeof member.member === "number"
}

function hasTitle<T extends CodeBlockNestingParent>(part: T): part is T & Title {
  return typeof (part as Title).title === "string"
}

/* function hasDescription<T extends CodeBlockNestingParent>(part: T): part is T & Description {
  return typeof (part as Description).description === "string"
} */

function hasKind<T extends CodeBlockNestingParent, K extends T["kind"]>(part: T, kind: K): part is T & Kind<K> {
  return (part as T).kind === kind
}

export function isChoice(part: CodeBlockNestingParent): part is Choice {
  return isGroupMember(part) && hasTitle(part) && hasKind(part, "Choice")
}

export function isImport(part: CodeBlockNestingParent): part is Import {
  return hasTitle(part) && hasKind(part, "Import")
}

export function isWizardStep(part: CodeBlockNestingParent): part is WizardStep {
  return hasKind(part, "WizardStep")
}

export type CodeBlockProps = Partial<Validatable> & {
  id: string
  body: string
  language: string
  optional?: boolean
  nesting?: CodeBlockNestingParent[]
}

export function addNesting(props: CodeBlockProps, nesting: CodeBlockNestingParent, insertIdx?: number) {
  if (!props.nesting) {
    props.nesting = []
  }

  if (typeof insertIdx === "number") {
    props.nesting.splice(insertIdx, 0, nesting)
  } else {
    props.nesting.push(nesting)
  }
}
