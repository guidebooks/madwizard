# Test support for zsh variable expansion

By default zsh does not do word splitting on unquoted variable
expansions. This test ensures that madwizard's shell executor has zsh
behave like bash, in that `${=OPT}` is not needed to perform
word-splitting.
    
```shell
export OPT='-v foo=bar'
```

```shell
awk ${OPT} 'BEGIN {print foo}'
```
