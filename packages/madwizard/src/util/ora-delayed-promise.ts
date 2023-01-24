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

import { PromiseOptions } from "ora"

/** Fire of an `oraPromise` with a delay */
export async function oraPromise<T>(
  action: T | Promise<T>,
  options?: string | PromiseOptions<T>,
  delayMs = 500
): Promise<T> {
  const { oraPromise: theRealOraPromise } = await import("ora")

  let isResolved = false
  Promise.resolve(action)
    .then(() => (isResolved = true))
    .catch(() => (isResolved = true))

  if (!isResolved) {
    setTimeout(() => {
      if (!isResolved) {
        theRealOraPromise(Promise.resolve(action), options).catch(() => {
          /* the caller will be alerted by our `return action` */
        })
      }
    }, delayMs)
  }

  return Promise.resolve(action)
}
