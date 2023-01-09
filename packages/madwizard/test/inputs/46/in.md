```shell
export choice="n/a"
```

```shell
export IMAGE_PULL_SECRET=$([ "${choice}" = "n/a" ] && echo "" || echo "${choice}")
```

```shell
if [ -n "$IMAGE_PULL_SECRET" ]; then echo "FAIL"
else echo "PASS"
fi
```
