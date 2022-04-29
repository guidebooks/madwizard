[![Node.js CI](https://github.com/guidebooks/madwizard/actions/workflows/test.yml/badge.svg)](https://github.com/guidebooks/madwizard/actions/workflows/test.yml)

# Turn Your Markdown into Wizards

This module scans a given markdown file and automatically constructs a
task graph.

<img width="300" src=".github/FREEANIMALREPTILEtrex003_generated.jpg" title="Fire Breathing Rainbow Trex Dinosaur Vectors by Vecteezy" align="right">

## Installation

```shell
npm install -g madwizard
madwizard <command> <input filepath or URL>.md
```

## Madwizard Commands

- `guide`: Present a wizard that walks you through the choices and task execution for the given markdown.
- `tree`: Visualize the task graph model inferred by madwizard.
- `timing`: For debugging, in case you are curious as to why madwizard is slow.
- `fetch`: For debugging, in case you suspect that madwizard is not properly fetching your file snippets.

### Options

- `-n/--narrow`: restrict the amount of each code block that is displayed.
- `-O0`: do not attempt any fancy optimizations on the task graph.
- `--no-aprioris`: do not scan the environment to determine the answer to questions.

---

<a href="https://www.vecteezy.com/free-vector/teeth">Teeth Vectors by Vecteezy</a>
