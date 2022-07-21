Test multi-line shell scripts.

```shell
echo hello \
world
```

```shell
echo hello \
world \
again
```

With shell variables

```shell
export FOO=333333
```

```shell
echo AAAAAA \
$FOO xxx \
$FOO $FOO xxx \
   $FOO
```
