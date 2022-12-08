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

- **Task Graph Generation Library**: point to your markdown
  documentation and `madwizard` generates an execution plan.

- **Test Rig**: you may use `madwizard` to run through that plan in an
  automated fashion.

- **ASCII CLI Wizards**: a `madwizard` plan allows for choice, and
  includes an executor that interrogates the user using a familiar
  terminal Q&A experience, enlisting their help in guiding the plan.

- **Graphical Wizards**: the wizard executor supports inversion of
  control, whereby a Q&A exchange may be intercepted and presented
  with a custom, e.g. graphical, interface.

## Gallery

You may find the source for these [here](https://github.com/guidebooks/store/tree/main/guidebooks).

<a target="_blank" href="https://asciinema.org/a/0jFdCBTs76MVzHXZ94FFHg2aR"><img width="260" alt="ibm/cloud/ce/job/run" title="ibm/cloud/ce/job/run" src="https://asciinema.org/a/0jFdCBTs76MVzHXZ94FFHg2aR.svg"></a>
<a target="_blank" href="https://asciinema.org/a/KXm9iScAAwEzDi6WIxSMbxhwh"><img width="260" alt="ibm/cloud/ce/app/deploy" title="ibm/cloud/ce/app/deploy" src="https://asciinema.org/a/KXm9iScAAwEzDi6WIxSMbxhwh.svg"></a>
<a target="_blank" href="https://asciinema.org/a/Pnbg3QnT9ujj0YAfEizOyNkzi"><img width="260" alt="knative/provision" title="knative/provision" src="https://asciinema.org/a/Pnbg3QnT9ujj0YAfEizOyNkzi.svg"></a>
<a target="_blank" href="https://asciinema.org/a/Z5CCiLaJl0gSaeZ7suxPkajKV"><img width="260" alt="ml/ray/run" title="ml/ray/run" src="https://asciinema.org/a/Z5CCiLaJl0gSaeZ7suxPkajKV.svg"></a>
<a target="_blank" href="https://asciinema.org/a/FdrDQaBUIIZiKPts9kwp6iogo"><img width="260" alt="test/iter8/load/http" title="test/iter8/load/http" src="https://asciinema.org/a/FdrDQaBUIIZiKPts9kwp6iogo.svg"></a>

## Installation

If you wish to consume this as a library, then:

```shell
npm install madwizard
```

If you wish to consume this as a CLI, then:

```shell
npm install -g madwizard-cli
```

The CLI includes a build of the [guidebook
store](https://github.com/guidebooks/store). For example, to choose
one of your Kubernetes namespaces, try `madwizard
kubernetes/choose/ns`.

## Next Steps

- [How to code a wizard in markdown](./docs/markdown#readme)
- [Contributing](./docs/dev#readme)
