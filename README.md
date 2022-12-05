[![Node.js CI](https://github.com/guidebooks/madwizard/actions/workflows/test.yml/badge.svg)](https://github.com/guidebooks/madwizard/actions/workflows/test.yml) [![npm version](https://badge.fury.io/js/madwizard.svg)](https://badge.fury.io/js/madwizard)

# <img src=".github/madwizard.gif" title="madwizard" height="32"> Turn Markdown into Wizards

`madwizard` allows you to:

1. test your markdown documentation
2. automatically generate wizards that step your users through your documentation

You can interact with `madwizard` in one of four ways:

a) As a **test rig**; point to your documentation and madwizard can generate initial desired output models, and then regression test updates on your side against the desired output.
b) As a library that generates **task graph and wizard models from markdown**.
c) As an **ASCII CLI tool** that executes the wizard model, stepping users through the choices they need to make and the tasks that should be performed on their systems.
d) Finally, madwizard's wizard executor supports callbacks, allowing you to wrote your own custom (even graphical) UI.

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
