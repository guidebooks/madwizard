# Exports

## Export an env var

Intentionally referencing `$BAM`, to test default values.

```shell
export BASE=$(echo 2)
```

```shell
export FOO=${BAM-3}
```

```shell
export FOO="$BASE:$FOO"
```

## Then use it

```shell
echo "This should be 2:3 --> $FOO"
```

## Propagation check

This should be valid, if FOO is propagated correctly to the validator.

```shell
---
validate: "[ \"$FOO\" = \"2:3\" ]"
---
echo "Bug if we get here"
```
