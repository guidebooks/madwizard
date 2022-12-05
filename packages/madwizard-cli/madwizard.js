#!/usr/bin/env node

/* eslint-env node */
/* ^^^ rather than add env: node globally in package.json */

import { dirname, join } from "path"
import { createRequire } from "module"
const require = createRequire(import.meta.url)

/**
 * This is a trivial front-end to the CLI module that quickly loads
 * just the cli module. Loading the entire index of madwizard is quite
 * a bit slower (maybe we can optimize that at some point).
 *
 */

/**
 * Here, we handle either being run as a `bin` of an installed npm
 * (isNpx===true), or being run directly.
 */
const isNpx = process.env.npm_command === "exec"

/** Find the root directory to our cli module shortcut */
const madwizard = isNpx ? "madwizard" : "../madwizard"

if (!process.env.MWSTORE && !process.argv.find((_) => /-s|--store/.test(_))) {
  // we will use the built-in store (the one shipped with the
  // `@guidebook/store` npm)
  const store =
    process.env.GUIDEBOOK_STORE || join(dirname(require.resolve("@guidebooks/store/package.json")), "dist/store")
  process.argv.push(`--store=${store}`)
}

import(madwizard + "/dist/fe/cli/index.js")
  .then((_) => _.cli(process.argv.slice(1)))
  .catch((err) => {
    if (process.env.DEBUG) {
      console.log(err)
    } else if (err && err.message) {
      console.log(err.message)
    }
    process.exit(1)
  })
