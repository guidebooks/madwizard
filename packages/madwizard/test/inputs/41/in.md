```shell
export KEY=333
```

=== "expand(garbage this should fail if ever executed, Testing env var keying, KEY)"
    ```shell
    echo "These two should be equal $choice===$KEY"
    ```

=== "Alternate plan"
    ```shell
    echo "Error if we get here"
    exit 90
    ```
