# Custom exec

These two should behave the same.

## Using Default Exec

```shell
echo hi
```

## Using Default Exec (again)

Again, to make sure there are no bugs with executing the same body in
a different code block.

```shell
echo hi
```

## Using Custom Exec

```shell
---
exec: $SHELL "$MWFILEPATH"
---
echo hi
```
