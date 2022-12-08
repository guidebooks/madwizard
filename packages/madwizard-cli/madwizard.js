#!/usr/bin/env node

/* eslint-env node */
/* ^^^ rather than add env: node globally in package.json */

import { cli } from "madwizard/dist/fe/cli/index.js"
import { dirname, join } from "path"
import { createRequire } from "module"
const require = createRequire(import.meta.url)

/**
 * This is a trivial front-end to the CLI module that quickly loads
 * just the cli module. Loading the entire index of madwizard is quite
 * a bit slower (maybe we can optimize that at some point).
 *
 */

if (!process.env.MWSTORE && !process.argv.find((_) => /-s|--store/.test(_))) {
  // we will use the built-in store (the one shipped with the
  // `@guidebook/store` npm)
  const store =
    process.env.GUIDEBOOK_STORE || join(dirname(require.resolve("@guidebooks/store/package.json")), "dist/store")
  process.argv.push(`--store=${store}`)
}

cli(process.argv.slice(1)).catch((err) => {
  if (process.env.DEBUG) {
    console.log(err)
  } else if (err && err.message) {
    console.log(err.message)
  }
  process.exit(1)
})
