# Markdown Features Supported by `madwizard`

# Choice

You may offer a choice to the user by using [PyMdown's tabbed syntax](https://facelessuser.github.io/pymdown-extensions/extensions/tabbed/)

# Early Exit

Code blocks may request that a guidebook exits early, but with a
normal `0` overall exit code, by exiting that shell block with a `90`
exit code (there is no particular meaning to this exit code):

```shell
echo "Stopping execution normally"
exit 90
```
