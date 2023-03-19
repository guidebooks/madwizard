#!/usr/bin/env bash

#
# Use this to regenerate the test output. Take care to update the
# index of the largest test input directory in the for loops below,
# when you add more tests.
#

function opts {
    if [ -f ./test/inputs/$1/assert.txt ]; then
        ASSERT="$(./bin/format-assert.sh assert ./test/inputs/$1/assert.txt)"
    else
        ASSERT=""
    fi

    if [ -f ./test/inputs/$1/veto.txt ]; then
        VETO="$(./bin/format-assert.sh veto ./test/inputs/$1/veto.txt)"
    else
        VETO=""
    fi
}

TOP=$(cd $(dirname "$0")/../../../ && pwd)
cd "$TOP/packages/madwizard"

export PATH="$TOP"/bin:$PATH
which madwizard

WHICH=$1

export STORE="--store $PWD"

FAKEENV=$(mktemp)

echo -n A
for i in {1..52}
do
    if [ -n "$WHICH" ] && [ $i != $WHICH ]; then continue; fi

    ENV=$([ -f ./test/inputs/$i/env.txt ] && echo ./test/inputs/$i/env.txt || echo $FAKEENV)

    opts $i
    eval "set -o allexport; source $ENV; madwizard plan $STORE test/inputs/$i/in.md -O0 $ASSERT > ./test/inputs/$i/tree-noopt.txt" &
    eval "set -o allexport; source $ENV; madwizard json $STORE test/inputs/$i/in.md -O0 $ASSERT > ./test/inputs/$i/wizard-noopt.json" &
    eval "set -o allexport; source $ENV; madwizard run $STORE test/inputs/$i/in.md --verbose --no-profile -O0 $ASSERT > ./test/inputs/$i/run-noopt.txt" &

    eval "set -o allexport; source $ENV; madwizard plan $STORE test/inputs/$i/in.md --no-aprioris $ASSERT > ./test/inputs/$i/tree-noaprioris.txt" &
    eval "set -o allexport; source $ENV; madwizard json $STORE test/inputs/$i/in.md --no-aprioris $ASSERT > ./test/inputs/$i/wizard-noaprioris.json" &
    eval "set -o allexport; source $ENV; madwizard run $STORE test/inputs/$i/in.md --verbose --no-profile --no-aprioris $ASSERT > ./test/inputs/$i/run-noaprioris.txt" &

    if [ -n "$VETO" ]; then
        eval "set -o allexport; source $ENV; madwizard plan $STORE test/inputs/$i/in.md $ASSERT $VETO > ./test/inputs/$i/tree-veto.txt" &
        eval "set -o allexport; source $ENV; madwizard json $STORE test/inputs/$i/in.md -O0 $ASSERT $VETO > ./test/inputs/$i/wizard-veto.json" &
    fi

    wait
    echo -n .
done
echo

echo -n B
for i in {1..8} {11..18} {20..22} {24..52}
do
    if [ -n "$WHICH" ] && [ $i != $WHICH ]; then continue; fi

    ENV=$([ -f ./test/inputs/$i/env.txt ] && echo ./test/inputs/$i/env.txt || echo $FAKEENV)
    
    opts $i
    eval "set -o allexport; source $ENV; madwizard plan $STORE test/inputs/$i/in.md $ASSERT > ./test/inputs/$i/tree.txt" &
    eval "set -o allexport; source $ENV; madwizard json $STORE test/inputs/$i/in.md $ASSERT > ./test/inputs/$i/wizard.json" &
    eval "set -o allexport; source $ENV; madwizard run $STORE test/inputs/$i/in.md $ASSERT --verbose --no-profile > ./test/inputs/$i/run.txt" &

    if [ -n "$VETO" ]; then
        eval "set -o allexport; source $ENV; madwizard plan $STORE test/inputs/$i/in.md $ASSERT $VETO > ./test/inputs/$i/tree-veto.txt" &
        eval "set -o allexport; source $ENV; madwizard json $STORE test/inputs/$i/in.md -O0 $ASSERT $VETO > ./test/inputs/$i/wizard-veto.json" &
    fi

    wait
    echo -n .
done
echo

echo -n C
for i in 9 10 19 23
do
    if [ -n "$WHICH" ] && [ $i != $WHICH ]; then continue; fi

    opts $i
    ENV=$([ -f ./test/inputs/$i/env.txt ] && echo ./test/inputs/$i/env.txt || echo $FAKEENV)

    for platform in darwin linux win32
    do
        if [ -f ./test/inputs/$i/assert.txt ]; then
            ASSERT="$(set -o allexport; source $ENV; ./bin/format-assert.sh ./test/inputs/$i/assert.txt)"
        fi
        ASSERT2="--assert=madwizard/apriori/platform=$platform"
        eval "set -o allexport; source $ENV; madwizard plan $STORE test/inputs/$i/in.md $ASSERT $ASSERT2 > ./test/inputs/$i/tree-$platform.txt" &
        eval "set -o allexport; source $ENV; madwizard json $STORE test/inputs/$i/in.md $ASSERT $ASSERT2 > ./test/inputs/$i/wizard-$platform.json" &
        eval "set -o allexport; source $ENV; madwizard run $STORE test/inputs/$i/in.md $ASSERT $ASSERT2 --verbose --no-profile > ./test/inputs/$i/run-$platform.txt" &

        if [ -n "$VETO" ]; then
            eval "set -o allexport; source $ENV; madwizard plan $STORE test/inputs/$i/in.md $ASSERT $ASSERT2 $VETO > ./test/inputs/$i/tree-veto.txt" &
            eval "set -o allexport; source $ENV; madwizard json $STORE test/inputs/$i/in.md -O0 $ASSERT $ASSERT2 $VETO > ./test/inputs/$i/wizard-veto.json" &
        fi
    done
    wait
    echo -n .
done
echo

echo "reformatting..."
npm run format:test:input >& /dev/null
