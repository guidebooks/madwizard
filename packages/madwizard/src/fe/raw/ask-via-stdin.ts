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
import { ValidAnswer } from "./RawEvent.js"
import { WithRawViaCLI } from "./index.js"

/** Ask a question via the raw api, using stdin */
export default async function askViaStdin(
  prompt: Prompt,
  description: string | undefined,
  rawPrefix: WithRawViaCLI["raw"]
) {
  const readline = await import("node:readline")
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
