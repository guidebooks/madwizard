# Testing tab expansion

```shell
export A=3
```

=== "expand(echo ${A-error} ; echo ${B-4} ; echo ${C-5})"
    This should emit ${choice} to your terminal.
    ```shell
    echo "${choice}"
    ```
