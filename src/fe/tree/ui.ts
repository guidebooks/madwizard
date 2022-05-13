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

import terminalLink from "terminal-link"
import { highlight } from "cli-highlight"
import chalk, { Modifiers, Color } from "chalk"

import { Status } from "../../graph"

export type Decoration = Modifiers | Color

export interface UI<Content> {
  span(body: string, ...decorations: Decoration[]): Content
  code(body: string, language: string, optional?: boolean, hasValidation?: boolean): Content
  icon(cls: string): Content
  statusToIcon(status: Status): Content
  title(title: Content | string | (Content | string)[], status?: Status): Content
  open?(filepath: string): Content
  markdown(body: string): Content
}

export class DevNullUI implements UI<string> {
  public span() {
    return ""
  }

  public code() {
    return ""
  }

  public icon() {
    return ""
  }

  public statusToIcon() {
    return ""
  }

  public title() {
    return ""
  }

  public markdown() {
    return ""
  }
}

export class AnsiUI implements UI<string> {
  public span(content: string, ...decorations: Decoration[]) {
    if (decorations.length === 0) {
      return content
    } else {
      return decorations.reduce((content, decoration) => chalk[decoration](content), content)
    }
  }

  public code(body: string, language: string, optional = false, hasValidation = false) {
    const outerSuffix = hasValidation ? chalk.bold.yellow(" †") : ""
    const innerSuffix = optional ? " [OPTIONAL]" : ""
    const color = optional ? chalk.magenta.dim : chalk.magenta
    const bodyUI = highlight(body, { language })

    return (language === "shell" ? color(bodyUI) : bodyUI) + color(innerSuffix) + outerSuffix
  }

  public icon(cls: string) {
    switch (cls) {
      case "Guidebook":
        return "\u1F56E"
      case "GuidebookOpen":
        return "\u1F4D6"
    }
  }

  public statusToIcon(status: Status) {
    switch (status) {
      case "success":
        return chalk.green("\u2713")
    }
  }

  public title(title: string | string[], status?: Status) {
    if (Array.isArray(title)) {
      return title.map((_) => this.title(_, status)).join(" ")
    } else if (status && status === "error") {
      return chalk.red.italic(title)
    } else {
      return title
    }
  }

  /** Primitive, here, for now. */
  public markdown(body: string) {
    return body
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, p1, p2) => terminalLink(p1, p2)) // links
      .replace(/`([^`]+)`/g, (_, p1) => this.code(p1, "markdown"))
  }
}
