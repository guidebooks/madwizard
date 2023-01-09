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

import { Barrier, CustomExecutable, Validatable } from "../../../codeblock"

export interface WizardSteps {
  /** An alternate way to define the steps of a wizard layout */
  wizard: {
    /** Optional subtitle in the wizard header */
    description?: string

    /** Show progress UI that tracks execution of code blocks [default: 'bar'] */
    progress?: "bar" | "none"

    /**
     * Specification of the steps, each of which is the name of a
     * heading in the markdown source. Optionally, a step description
     * may be overlaid
     */
    steps: (string | { match?: string; name: string; description: string })[]
  }
}

interface Language {
  /** Override any `language` property of the matched code block */
  language?: string
}

export type CodeBlock = Partial<Language> &
  Partial<CustomExecutable> &
  Partial<Validatable> & {
    /**
     * A string that will be interpreted as regular expression. Any
     * markdown code blocks whose body matches this pattern will be seen
     * as instances of the rules below (e.g. `language`, `validate`, etc.)
     */
    match: string

    /**
     * If given, this command line will undo the effects of the code
     * block body.
     */
    cleanup?: string

    /**
     * Is successful execution of this code block seen as necessary
     * for overall successful completion of the enclosing
     * guidebook? */
    optional?: boolean
  }

interface CodeBlocks {
  codeblocks: CodeBlock[]
}

/** An individual import is either a path to imported content, or a pair (path, group) */
export type Import =
  | string
  | {
      /** Path to imported content */
      path: string

      /**
       * The idempotency group to use for this import; this allows one to
       * import the same guidebook multiple times, each with a different
       * set of "arguments".
       */
      group: string

      /** Environment variables to use for the import */
      env: Record<string, string>
    }

/** Path to imported content */
export function getImportPath(importStmt: Import) {
  return typeof importStmt === "string" ? importStmt : importStmt.path
}

/**
 * The idempotency group to use for this import; this allows one to
 * import the same guidebook multiple times, each with a different *
 * set of "arguments".
 */
export function getImportGroup(importStmt: Import) {
  return typeof importStmt === "string" ? undefined : importStmt.group
}

/**
 * The environment variables associated with this import
 */
export function getImportEnv(importStmt: Import) {
  return typeof importStmt === "string" ? undefined : importStmt.env
}

interface Imports {
  imports: Import[]
}

export function hasImports(attributes: KuiFrontmatter): attributes is KuiFrontmatter & Imports {
  return (
    attributes &&
    typeof attributes === "object" &&
    Array.isArray(attributes.imports) &&
    attributes.imports.every(
      (_) =>
        typeof _ === "string" ||
        (typeof _ === "object" &&
          typeof _.path === "string" &&
          (typeof _.group === "string" || typeof _.group === "undefined"))
    )
  )
}

/** Guidebooks to execute when this guidebook completes */
interface Finally {
  finally: string[]
}

/** Does this provided a list of finalizer guidebooks? */
export function hasFinally(fm: KuiFrontmatter): fm is KuiFrontmatter & Finally {
  return Array.isArray(fm.finally)
}

type KuiFrontmatter = Partial<WizardSteps> &
  Partial<Barrier> &
  Partial<Imports> &
  Partial<Finally> &
  Partial<Validatable> &
  Partial<CodeBlocks> & {
    /** Title of the Notebook */
    title?: string

    /** Used internally */
    layoutCount?: Record<string, number>

    /**
     * A mapping that indicates which section (the `number` values) should be rendered in a given split position.
     */
    layout?: "wizard" | Record<number | "default", SplitPositionSpec>
  }

export function hasWizardSteps(frontmatter: KuiFrontmatter): frontmatter is KuiFrontmatter & Required<WizardSteps> {
  return (
    frontmatter.wizard &&
    frontmatter.wizard.steps &&
    Array.isArray(frontmatter.wizard.steps) &&
    frontmatter.wizard.steps.length > 0
  )
}

export function hasCodeBlocks(frontmatter: KuiFrontmatter): frontmatter is KuiFrontmatter & Required<CodeBlocks> {
  return frontmatter.codeblocks && Array.isArray(frontmatter.codeblocks) && frontmatter.codeblocks.length > 0
}

type SplitPosition = "left" | "right" | "default" | "wizard" | "terminal"
type SplitPositionObj = {
  position: SplitPosition
  placeholder?: string
  maximized?: boolean
  inverseColors?: boolean
}
type SplitPositionSpec = SplitPosition | SplitPositionObj

export type PositionProps = {
  "data-kui-split": SplitPosition
}

export function isValidPosition(position: SplitPositionSpec): position is SplitPosition {
  return (
    typeof position === "string" &&
    (position === "default" ||
      position === "left" ||
      position === "right" ||
      position === "wizard" ||
      position === "terminal")
  )
}

export function isNormalSplit(position: SplitPosition) {
  return position === "default" || position === "terminal"
}

export function isValidPositionObj(position: SplitPositionSpec): position is SplitPositionObj {
  const pos = position as SplitPositionObj
  return typeof pos === "object" && isValidPosition(pos.position)
}

export default KuiFrontmatter
