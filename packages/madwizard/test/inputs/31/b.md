---
imports:
    - path: ./choice.md
      group: YYYYYY
      env:
          SUFFIX: YYYY
---

This variable should be defined.

```shell
echo ${FOOYYYY}
```

This variable should not be defined.

```shell
if [ -n "${FOO}" ]; then echo "BUG_B ${FOO}"; fi
```
