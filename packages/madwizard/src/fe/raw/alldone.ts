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

import { RawAllDoneEvent } from "./RawEvent.js"
import { isRawViaHandler, WithRawViaCLI, WithRawViaHandler } from "./index.js"

export function alldone(options: WithRawViaCLI | WithRawViaHandler, success: RawAllDoneEvent["success"]) {
  const event: RawAllDoneEvent = { type: "all-done", success }

  if (isRawViaHandler(options)) {
    options.raw(event)
  } else {
    console.log(options.raw + " " + JSON.stringify(event) + "\n")
  }
}
