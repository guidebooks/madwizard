# `madwizard` Development

To start up the watcher:

```shell
npm ci
npm run watch
./bin/madwizard demo/hello
```

## Running Tests

To run tests:

```shell
npm test # will run all tests
npm test 21 22 # will run just those two inputs
```

The assumption is that test inputs are numbered directories under `test/inputs`. Each such directory is assumed to have:

- in.md; the input markdown file
- tree.txt; the expected output of `./bin/madwizard plan <that_in.md>`
- wizard.json; ibid for `./bin/madwizard json test <that_in.md>`
- run.txt; ibid for `./bin/madwizard run test <that_in.md>`

If your input has expected variances with optimizations disabled, then also:

- tree-noopt.txt, wizard-noopt.txt; the expected outputs with `-O0`
- tree-noaprioris.txt, wizard-noaprioris.txt; ibid for `--no-aprioris`

If you wish to assert answers to certain choices, then also:

- assert.txt; of the form `choice=value`, one per line

# Releases to npm

Releases are typically done via on a fresh clone from the
upstream/main fork. Run `release-it` in your fresh clone. This repo
does not include the release-it dependencies (they are huge). You will
have to install this separately (`npm install -g release-it`). Also,
consult the top-level package.json to see which `release-it` plugins
are also needed.
