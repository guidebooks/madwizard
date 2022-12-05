# Test for asynchronous code block execution.

```shell
echo AAA
```

This code block's output shuld not be seen by the `run` test, because
the guidebook run will have completed before the sleep finishes.

```shell.async
sleep 20
echo BBB
```

```{.shell .YYY}
echo CCC
```
