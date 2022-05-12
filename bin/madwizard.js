#!/usr/bin/env -S node --experimental-specifier-resolution=node --no-warnings

/* eslint-env node */
/* ^^^ rather than add env: node globally in package.json */

/**
 * This is a front-end to the CLI module.
 */

const isNpx = process.env.npm_command === "exec"

import(isNpx ? "madwizard" : "..")
  .then((_) => _.cli(process.argv.slice(1)))
  .catch((err) => {
    if (process.env.DEBUG) {
      console.log(err)
    } else {
      console.log(err.message)
    }
    process.exit(1)
  })
