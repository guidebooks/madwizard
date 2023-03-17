## Mount path

=== "form(echo $OPTIONS | tr ' ' '\n', /$choice)"
    ```shell
    echo "You selected: $choice"
    ```

    ```shell
    export YOYO="$YOYO $choice"
    ```
