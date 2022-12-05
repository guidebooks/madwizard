cat $2 | awk -v assert=$1 -v S="'" '{printf " --%s=%s%s%s", assert, S, $0, S}'
