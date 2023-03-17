## Mount path

=== "form(echo $OPTIONS | tr ' ' '\n', /$choice)"
    ```shell
    echo "You selected: $choice $idx"
    ```

    ```shell
    export YOYO="$YOYO $choice"
    ```
