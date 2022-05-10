# Exports

## Export an env var

```shell
export FOO=3
```

```shell
export FOO=2:$FOO
```

## Then use it

```shell
echo "This should be 2:3 --> $FOO"
```
