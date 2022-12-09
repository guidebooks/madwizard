[![Node.js CI](https://github.com/guidebooks/madwizard/actions/workflows/test.yml/badge.svg)](https://github.com/guidebooks/madwizard/actions/workflows/test.yml) [![npm version](https://badge.fury.io/js/madwizard.svg)](https://badge.fury.io/js/madwizard)

# <img src=".github/madwizard.gif" title="madwizard" height="32"> Turn Markdown into Wizards

READMEs are a great way to share, but not always the most useful way
to accomplish a task. Documentation is prone to rot. Screenshots and
command lines invariably go out of date. Sometimes a README may never
have worked as written, due to gaps in the documented tasks,
divergences from the implementation, or incompletely specified
prerequisites.

Even for complete and up-to-date READMEs, it is often unclear how to
turn the documentation into a reliable plan of execution. Which code
blocks are optional? Which have I already done on my laptop? How
about in my cluster? How much of the overly general documentation is
relevant to my system?

With `madwizard`, you can automate testing and consumption of
documentation. Point `madwizard` at markdown, and it can generate an
execution plan, and help you (and your users) execute these reliably.

## The `madwizard` User Experience

With `madwizard`, several interaction modes are possible.

- **Task Graph Library**: point to your markdown documentation and
  `madwizard` generates an execution plan.

- **Test Rig**: you may use `madwizard` to run through that plan in an
  automated fashion.

- **ASCII CLI Wizards**: a `madwizard` plan allows for choice, and
  includes an executor that interrogates the user using a familiar
  terminal Q&A experience, enlisting their help in guiding the plan.

- **Graphical Wizards**: the wizard executor supports inversion of
  control, whereby a Q&A exchange may be intercepted and presented
  with a custom, e.g. graphical, interface.

## Installation

```shell
npm install madwizard        # consume as a library
npm install -g madwizard-cli # consume as a CLI tool
```

The CLI package includes a copy of the [guidebook
store](https://github.com/guidebooks/store). If you want to roll your
own collection of guidebooks, you can install `madwizard-cli-core`,
which is the same, but without a copy of the guidebook store.

## Kicking the Tires

After installing `madwizard-cli`, you can try some of the demo guidebooks:

```shell
madwizard demo/hello
madwizard demo/choice
madwizard kubernetes/choose/ns
```

## Next Steps

- [How to code a wizard in markdown](./docs/markdown#readme)
- [Contributing](./docs/dev#readme)
