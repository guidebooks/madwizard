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

function guidebook {
    local P="$2"
    local G="$3"
    local A="$4"
    local E="$5"
    MWPROFILES_PATH="$(dirname "$P")" \
                   madwizard guide --yes -q \
                   -p "$(basename $P)" \
                   -s "$(dirname "$G")" \
                   "$(basename $G)" >& $A
    if diff "$A" "$E";
    then printf "guide $1: \033[32mPASS\033[0m\n"
    else (printf "guide $1: \033[31mFAIL\033[0m\n" && exit 1)
    fi
}

trap cleanup EXIT

P1="$SCRIPTDIR"/inputs/1/profile.json
G1="$SCRIPTDIR"/inputs/1/guidebook.md
P1Name=TEST_PROFILE
P1bName=TEST_PROFILE1b
P1cName=TEST_PROFILE1c

P2="$SCRIPTDIR"/inputs/2/profile.json
G2="$SCRIPTDIR"/inputs/2/guidebook.md
E2="$SCRIPTDIR"/inputs/2/expected.txt

P3="$SCRIPTDIR"/inputs/3/profile.json
G3="$SCRIPTDIR"/inputs/3/guidebook.md
E3="$SCRIPTDIR"/inputs/3/expected.txt

# -------------------
# Here come the tests
# -------------------

# initially, no profiles
shouldHave 0

# import P1 and show that one profile
import "$P1"
shouldHave 1
shouldList $P1Name

# delete and show no profiles
delete $P1Name
shouldHave 0

# import P1 again, and show that one profile
import "$P1"
shouldHave 1
shouldList $P1Name

# export P1, verify that it survived the import-export roundtrip, and
# list should show it, still
exporty $P1Name
same "$P1" "$out" $P1Name
shouldHave 1
shouldList $P1Name

# import what we exported (import P1 -> export) using an alternate
# name P1b
import "$out" --name $P1bName
shouldHave 2
shouldList $P1Name
shouldList $P1bName

# export the P1b that we just imported
exporty $P1bName
same "$P1" "$out" $P1Name $P1bName
P1b="$out"

# clone P1 as P1c
clone $P1Name $P1cName
shouldHave 3
shouldList $P1Name
shouldList $P1cName
exporty $P1cName
same "$P1" "$out" $P1Name $P1cName
P1c="$out"

# do a guide run against the exported P1c
MWPROFILES_PATH="$(dirname "$P1c")" \
        madwizard guide --yes \
        -p "$(basename $P1c)" \
        -s "$(dirname "$G1")" \
        "$(basename $G1)"

# verify that we support json values for form in profile
A2=$(mktemp)
echo "A2 $A2" # this can help you to update E2 if changes are necessary
guidebook P2 "$P2" "$G2" "$A2" "$E2"

# this is the same as P2, but where the form is stringified in the profile
A3=$(mktemp)
echo "A3 $A3" # this can help you to update E3 if changes are necessary
guidebook P3 "$P3" "$G3" "$A3" "$E3"

# rerun P2 as a guidebook, but after an import/export round-trip
import "$P2" --name P2b
shouldList P2b
exporty P2b
P2b="$out" # this is the exported version of P2
A2b=$(mktemp)
guidebook P2b "$P2b" "$G2" "$A2b" "$E2" # run against the re-exported P2b profile, expecting the same E2 output

# rerun P3 as a guidebook, but after an import/export round-trip
import "$P3" --name P3b
shouldList P3b
exporty P3b
P3b="$out" # this is the exported version of P3
A3b=$(mktemp)
guidebook P3b "$P3b" "$G3" "$A3b" "$E3" # run against the re-exported P3b profile, expecting the same E3 output
