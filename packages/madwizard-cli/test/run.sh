#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

export PATH="$SCRIPTDIR"/../../madwizard-cli-core/bin:$PATH

# simplest way to avoid initial screen clear (for now)
export DEBUG=${DEBUG-xxx}

function test {
    TEST="$1"
    TESTNAME="${3-$TEST}"
    EXPECTED="$2"
    madwizard $TEST | grep -q "$EXPECTED" && printf "$TESTNAME: \033[32mPASS\033[0m\n" || (printf "$TESTNAME: \033[31mFAIL\033[0m\n" && exit 1)
}

test '--version' $(cd "$SCRIPTDIR"/../../.. && npm view madwizard version) version
test demo/hello "Hello world"

"$SCRIPTDIR"/import-export.sh
