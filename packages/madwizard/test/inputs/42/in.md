# Test choice descriptions with non-plain text

## Testing!

=== "Tab1"
    Description without newline after tab [with link](https://foo.com). That link should be visible.
    
    Do not include this!
    
    ```shell
    echo AAA
    ```

=== "Tab2"

    Description with newline after tab [with link](https://foo.com). That link should also be visible.
    
    Do not include this either!

    ```shell
    echo BBB
    ```

=== "Tab3"
    Description without newline after tab **with bold**. This text should also be visible.
    
    Also do not include this!

    ```shell
    echo CCC
    ```

=== "Tab4"
    Description without newline after tab *with emphasis*. This text should also be visible.
    
    Also do not include this!

    ```shell
    echo DDD
    ```

