#!/usr/bin/env bash

# TODO windows

for file in ./dist/*/*.*js; do
    T=$(mktemp)
    (npx terser --compress --mangle -- $file > $T && mv $T $file) &
done

wait
ls -lh ./dist/*/*.*js | awk '{printf "%-5s %s", $5, $NF "\n"}'
