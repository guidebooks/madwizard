cat $1 | awk -v S="'" '{printf " --assert=%s%s%s", S, $0, S}'
