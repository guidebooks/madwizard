[![Node.js CI](https://github.com/guidebooks/madwizard/actions/workflows/test.yml/badge.svg)](https://github.com/guidebooks/madwizard/actions/workflows/test.yml) [![npm version](https://badge.fury.io/js/madwizard.svg)](https://badge.fury.io/js/madwizard)

# <img src=".github/FREEANIMALREPTILEtrex003_generated.jpg" title="Fire Breathing Rainbow Trex Dinosaur Vectors by Vecteezy" height="32"> Turn Markdown into Wizards

MadWizard is a library that scans a given markdown file and
automatically constructs a task graph. It also includes a CLI client
to allow interacting with the library, either to visualize the task
graph (the `plan` command) or to step through the plan via an
interactive wizard (the `guide` command).

## Gallery

You may find the source for these [here](https://github.com/guidebooks/store/tree/main/guidebooks).

<a target="_blank" href="https://asciinema.org/a/0jFdCBTs76MVzHXZ94FFHg2aR"><img width="260" alt="ibm/cloud/ce/job/run" title="ibm/cloud/ce/job/run" src="https://asciinema.org/a/0jFdCBTs76MVzHXZ94FFHg2aR.svg"></a>
<a target="_blank" href="https://asciinema.org/a/KXm9iScAAwEzDi6WIxSMbxhwh"><img width="260" alt="ibm/cloud/ce/app/deploy" title="ibm/cloud/ce/app/deploy" src="https://asciinema.org/a/KXm9iScAAwEzDi6WIxSMbxhwh.svg"></a>
<a target="_blank" href="https://asciinema.org/a/Pnbg3QnT9ujj0YAfEizOyNkzi"><img width="260" alt="knative/provision" title="knative/provision" src="https://asciinema.org/a/Pnbg3QnT9ujj0YAfEizOyNkzi.svg"></a>
<a target="_blank" href="https://asciinema.org/a/Z5CCiLaJl0gSaeZ7suxPkajKV"><img width="260" alt="ml/ray/run" title="ml/ray/run" src="https://asciinema.org/a/Z5CCiLaJl0gSaeZ7suxPkajKV.svg"></a>
<a target="_blank" href="https://asciinema.org/a/FdrDQaBUIIZiKPts9kwp6iogo"><img width="260" alt="test/iter8/load/http" title="test/iter8/load/http" src="https://asciinema.org/a/FdrDQaBUIIZiKPts9kwp6iogo.svg"></a>

## Installation

```shell
npm install -g madwizard
```

## Usage

Point madwizard at a local or remote markdown file, and choose a
[command](#cli-client-commands) to execute. By default, the `guide`
command will be executed.

```shell
madwizard [<command>] <input filepath or URL>.md
```

### CLI Client Commands

- `guide`: Present a wizard that walks you through the choices and task execution for the given markdown. [default command, if none is specified]
- `plan`: Only plan (and then visualize) the tasks specified by a given document.
- `vetoes`: Print the list of vetoable choices. You may then call `guide` or `plan` with `--veto=x,y,z` where `x`, `y`, and `z` are members of that list.
- `version`: The version of madwizard you have installed.

#### Advanced Usage

- `--veto=x,y,z`: A command-separated list of choices to override.
- `-O0,--no-optimize`: do not attempt any fancy optimizations on the task graph.
- `--no-aprioris`: do not scan the environment to determine the answer to questions.

#### Miscelleneous Options

- `-n/--narrow`: restrict the amount of each code block that is displayed.
- `--mkdocs=url`: If you need to pass the URI of your mkdocs.yml

#### Debug Commands

- `timing`: In case you are curious as to why madwizard is slow.
- `fetch`: In case you suspect that madwizard is not properly fetching your file snippets.
- `json`: Emit the wizard model in JSON form.
- `topmatter`: Show the progress of processing the topmatter of the given document (and its imports).
- `groups`: Show how madwizard has modeled the choices represented by the given document.

---

<a href="https://www.vecteezy.com/free-vector/teeth">Teeth Vectors by Vecteezy</a>
