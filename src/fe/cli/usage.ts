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
import { basename } from "path"

import { validTasks } from "./tasks.js"

export default function usage(argv: string[], msg?: string) {
  if (msg) {
    console.error(chalk.red(msg))
  }
  console.error(
    `${chalk.bold.yellow("Usage:")} ${basename(argv[0]).replace(/\.js$/, "")} ${chalk.cyan(
      validTasks().join("|")
    )} <a filepath or url>`
  )
  process.exit(1)
}
