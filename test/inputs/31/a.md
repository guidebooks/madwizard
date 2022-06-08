---
imports:
    - path: ./choice.md
      group: XXXXXX
      env:
          SUFFIX: XXXX
---

This variable should be defined.

```shell
echo ${FOOXXXX}
```

This variable should not be defined.

```shell
if [ -n "${FOO}" ]; then echo "BUG_A ${FOO}"; fi
```
