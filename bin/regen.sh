echo -n A
for i in {1..30}
do
    if [ -f ./test/inputs/$i/assert.txt ]; then
        ASSERT="--assert=$(cat ./test/inputs/$i/assert.txt | tr '\n' ' ')"
    else
        ASSERT=""
    fi
    ./bin/madwizard.js plan ./test/inputs/$i/in.md -O0 "$ASSERT" > ./test/inputs/$i/tree-noopt.txt &
    ./bin/madwizard.js json ./test/inputs/$i/in.md -O0 "$ASSERT" > ./test/inputs/$i/wizard-noopt.json &
    ./bin/madwizard.js plan ./test/inputs/$i/in.md --no-aprioris "$ASSERT" > ./test/inputs/$i/tree-noaprioris.txt &
    ./bin/madwizard.js json ./test/inputs/$i/in.md --no-aprioris "$ASSERT" > ./test/inputs/$i/wizard-noaprioris.json &
    wait
    echo -n .
done
echo

echo -n B
for i in {1..8} {11..18} {20..22} {24..30}
do
    if [ -f ./test/inputs/$i/assert.txt ]; then
        ASSERT="--assert=$(cat ./test/inputs/$i/assert.txt)"
    else
        ASSERT=""
    fi
    ./bin/madwizard.js plan ./test/inputs/$i/in.md "$ASSERT" > ./test/inputs/$i/tree.txt &
    ./bin/madwizard.js json ./test/inputs/$i/in.md "$ASSERT" > ./test/inputs/$i/wizard.json &
    ./bin/madwizard.js run ./test/inputs/$i/in.md "$ASSERT" --verbose > ./test/inputs/$i/run.txt &
    wait
    echo -n .
done
echo

echo -n C
for i in 9 10 19 23
do
    for platform in darwin linux win32
    do
        if [ -f ./test/inputs/$i/assert.txt ]; then
            ASSERT="$ASSERT --assert=\"$(cat ./test/inputs/$i/assert.txt)\""
        fi
        ASSERT2="--assert=madwizard/apriori/platform=$platform"
        ./bin/madwizard.js plan ./test/inputs/$i/in.md "$ASSERT" "$ASSERT2" > ./test/inputs/$i/tree-$platform.txt &
        ./bin/madwizard.js json ./test/inputs/$i/in.md "$ASSERT" "$ASSERT2" > ./test/inputs/$i/wizard-$platform.json &
        ./bin/madwizard.js run ./test/inputs/$i/in.md "$ASSERT" "$ASSERT2" --verbose > ./test/inputs/$i/run-$platform.txt &
    done
    wait
    echo -n .
done
echo

npm run format:test:input
