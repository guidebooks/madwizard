# Nested Choice string injection

We expect the ${choice} strings to be replaced with NNN/BBB, respectively.

=== "AAA"
    Testing nested ${choice} expansion.

    :import{./nested}

=== "BBB"
    ```shell
    echo ${choice}
    ```
