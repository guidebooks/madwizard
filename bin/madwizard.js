#!/usr/bin/env node

/* eslint-env node */
/* ^^^ rather than add env: node globally in package.json */

import { dirname, join } from "path"
import { createRequire } from "module"
const require = createRequire(import.meta.url)

/**
 * This is a front-end to the CLI module.
 */

const isNpx = process.env.npm_command === "exec"
const madwizard = isNpx ? "madwizard" : ".."

const store =
  process.env.MWSTORE === "git"
    ? "https://github.com/guidebooks/store/blob/main/guidebooks"
    : process.env.MWSTORE || join(dirname(require.resolve(madwizard)), "store")
const argv = process.argv.slice(1).concat(["--store=" + store])

import(madwizard + "/dist/fe/cli/index.js")
  .then((_) => _.cli(argv))
  .catch((err) => {
    if (process.env.DEBUG) {
      console.log(err)
    } else if (err && err.message) {
      console.log(err.message)
    }
    process.exit(1)
  })
