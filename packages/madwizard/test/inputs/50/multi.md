# Test dynamic choices with dashes

=== "multi(echo dashy-dash; echo Tab2; echo mashy-mash-mash)"
    ```shell
    echo "You selected: $choice $idx"
    ```

    ```shell
    export YOYO="$YOYO $choice"
    ```
