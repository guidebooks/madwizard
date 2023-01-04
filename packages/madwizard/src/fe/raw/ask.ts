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

import { Prompt } from "../Prompts.js"
import { RawAskEvent, ValidAnswer } from "./RawEvent.js"
import { isRawViaHandler, WithRawViaCLI, WithRawViaHandler } from "./index.js"

async function askViaCLI(prompt: Prompt, description: string | undefined, rawPrefix: WithRawViaCLI["raw"]) {
  const readline = await import("readline")
  const r1 = readline.createInterface({
    terminal: false,
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise<ValidAnswer>((resolve, reject) => {
    try {
      r1.question(
        rawPrefix +
          " " +
          JSON.stringify({
            type: "ask",
            ask: {
              type: prompt.type,
              name: prompt.name,
              description: description,
              initial: prompt.initial,
              choices: prompt.choices,
            },
          }) +
          "\n",
        (resp) => {
          r1.close()
          try {
            resolve(JSON.parse(resp) as Record<string, string>)
          } catch (err) {
            resolve(resp)
          }
        }
      )
    } catch (err) {
      reject(err)
    }
  })
}

function askViaHandler(ask: Prompt, description: string, onRaw: WithRawViaHandler["raw"]) {
  return new Promise<ValidAnswer>((resolve, reject) => {
    const event: RawAskEvent = {
      type: "ask",
      ask,
      onChoose: resolve,
      onCancel: reject,
    }

    onRaw(event)
  })
}

export async function ask(ask: Prompt, description: string | undefined, options: WithRawViaCLI | WithRawViaHandler) {
  if (isRawViaHandler(options)) {
    return askViaHandler(ask, description, options.raw)
  } else {
    const { raw: rawPrefix } = options
    if (rawPrefix) {
      return askViaCLI(ask, description, rawPrefix)
    } else {
      throw new Error("Misconfiguration: raw mode requested, but neither onRaw nor rawPrefix provided")
    }
  }
}
