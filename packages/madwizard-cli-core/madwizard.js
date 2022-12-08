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

/* eslint-env node */
/* ^^^ rather than add env: node globally in package.json */

/**
 * This is a trivial front-end to the CLI module that quickly loads
 * just the cli module. Loading the entire index of madwizard is quite
 * a bit slower (maybe we can optimize that at some point).
 *
 */

import { cli } from "madwizard/dist/fe/cli/index.js" // load just the CLI bits

/** MadWizardOptions */
const opts = {}

if (!process.env.MWSTORE && !process.argv.find((_) => /-s|--store/.test(_))) {
  opts.store = process.env.GUIDEBOOK_STORE
}

cli(process.argv.slice(1), undefined, opts).catch((err) => {
  if (process.env.DEBUG) {
    console.log(err)
  } else if (err && err.message) {
    console.log(err.message)
  }
  process.exit(1)
})
