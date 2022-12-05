# Advanced CLI Options

## CLI Client Commands

- `guide`: Present a wizard that walks you through the choices and task execution for the given markdown. [default command, if none is specified]
- `plan`: Only plan (and then visualize) the tasks specified by a given document.
- `vetoes`: Print the list of vetoable choices. You may then call `guide` or `plan` with `--veto=x,y,z` where `x`, `y`, and `z` are members of that list.
- `version`: The version of madwizard you have installed.

## Advanced Usage

- `--veto=x,y,z`: A command-separated list of choices to override.
- `-O0,--no-optimize`: do not attempt any fancy optimizations on the task graph.
- `--no-aprioris`: do not scan the environment to determine the answer to questions.

## Miscelleneous Options

- `-n/--narrow`: restrict the amount of each code block that is displayed.
- `--mkdocs=url`: If you need to pass the URI of your mkdocs.yml

## Debug Commands

- `timing`: In case you are curious as to why madwizard is slow.
- `fetch`: In case you suspect that madwizard is not properly fetching your file snippets.
- `json`: Emit the wizard model in JSON form.
- `topmatter`: Show the progress of processing the topmatter of the given document (and its imports).
- `groups`: Show how madwizard has modeled the choices represented by the given document.
