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
import { EOL } from "os"
import { Writable } from "stream"
import { mainSymbols } from "figures"

import { AnsiUI, UI, elide } from "../tree"
import { CodeBlockProps } from "../../codeblock"

export function separatorPrefixLength() {
  return 2
}

export function separator(title = "") {
  const prefix = separatorPrefixLength()
  const { line } = mainSymbols

  return chalk.dim(
    line.repeat(prefix) + chalk.bold(title) + line.repeat(process.stdout.columns - 10 - prefix - title.length)
  )
}

/**
 * Process any messages coming from underlying executables.
 *
 */
export default function decorateStream(
  block: CodeBlockProps,
  stream: NodeJS.WriteStream & NodeJS.WritableStream,
  ui: UI<string> = new AnsiUI()
) {
  const ourPrefix = "Output for "
  stream.write(
    separator(`${ourPrefix}${ui.code(elide(block.body, 2 * separatorPrefixLength() + ourPrefix.length))}`) + EOL
  )

  return new Writable({
    write(chunk, encoding, callback) {
      stream.write(
        chunk
          .toString()
          .replace(
            /time=(.+) level=(.+) msg=(.+)/g,
            (_, time, level, msg) =>
              `${chalk.cyan(level.toUpperCase())}[${chalk.dim(new Date(time).toLocaleString())}] ${msg}`
          )
      )

      callback()
    },
  })
}
