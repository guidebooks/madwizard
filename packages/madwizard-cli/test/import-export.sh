#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

export PATH="$SCRIPTDIR"/../../madwizard-cli-core/bin:$PATH

# simplest way to avoid initial screen clear (for now)
export DEBUG=${DEBUG-xxx}

# to force a clean slate, with no imported profiles
export MWPROFILES_PATH=$(mktemp -d)

function cleanup {
    rm -f $MWPROFILES_PATH/*
    rmdir $MWPROFILES_PATH
}

function shouldBeEmpty {
    [[ $(madwizard profile list | wc -l | tr -d ' ') = 0 ]] \
        && printf "profile list is empty: \033[32mPASS\033[0m\n" \
            || (printf "profile list is empty: \033[31mFAIL\033[0m\n" && exit 1)
}

function import {
    if madwizard profile import "$@"
    then printf "profile import $(basename $1): \033[32mPASS\033[0m\n"
    else (printf "profile import $(basename $1): \033[31mFAIL\033[0m\n" && exit 1)
    fi
}

function exporty {
    out=$(mktemp)
    if $(madwizard profile export "$1" --no-prune > "$out")
    then printf "profile export $(basename $1): \033[32mPASS\033[0m\n"
    else (printf "profile export $(basename $1): \033[31mFAIL\033[0m\n" && exit 1)
    fi
}

function clone {
    if $(madwizard profile clone "$1" "$2")
    then printf "profile clone $1 $2: \033[32mPASS\033[0m\n"
    else (printf "profile clone $1 $2): \033[31mFAIL\033[0m\n" && exit 1)
    fi
}

function delete {
    if madwizard profile delete "$1"
    then printf "profile delete $1: \033[32mPASS\033[0m\n"
    else (printf "profile delete $1: \033[31mFAIL\033[0m\n" && exit 1)
    fi
}

function shouldHave {
    # include header row
    if [[ $1 != 0 ]]
    then local N=$(($1 + 1))
    else local N=$1
    fi

    [[ $(madwizard profile list | wc -l | tr -d ' ') = $N ]] \
        && printf "profile list shows $1: \033[32mPASS\033[0m\n" \
            || (printf "profile list shows $1: \033[31mFAIL\033[0m\n" && exit 1)
}

function shouldList {
    [[ $(madwizard profile list $1 | wc -l | tr -d ' ') = 2 ]] \
        && printf "profile list has $1 row: \033[32mPASS\033[0m\n" \
            || (printf "profile list has $1 row: \033[31mFAIL\033[0m\n" && exit 1)
}

function same {
    if diff --ignore-space-change <(grep -v $3 "$1" | grep -v creationTime | grep -v lastModifiedTime) <(grep -v ${4-$3} "$2" | grep -v creationTime | grep -v lastModifiedTime)
    then printf "profile roundtrip: \033[32mPASS\033[0m\n"
    else (printf "profile roundtrip: \033[31mFAIL\033[0m\n" && exit 1)
    fi
}

trap cleanup EXIT

P1="$SCRIPTDIR"/profile1.json
P1Name=TEST_PROFILE
P2Name=TEST_PROFILE2
P3Name=TEST_PROFILE3

# here come the tests
shouldHave 0

import "$P1"
shouldHave 1
shouldList $P1Name

delete $P1Name
shouldHave 0

import "$P1"
shouldHave 1
shouldList $P1Name

exporty $P1Name
same "$P1" "$out" $P1Name
shouldHave 1
shouldList $P1Name

import "$out" --name $P2Name
shouldHave 2
shouldList $P1Name
shouldList $P2Name

exporty $P2Name
same "$P1" "$out" $P1Name $P2Name

clone $P1Name $P3Name
shouldHave 3
shouldList $P1Name
shouldList $P3Name
exporty $P3Name
same "$P1" "$out" $P1Name $P3Name

