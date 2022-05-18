echo A
for i in {1..25}
do
    ./bin/madwizard.js plan ./test/inputs/$i/in.md -O0 > ./test/inputs/$i/tree-noopt.txt &
    ./bin/madwizard.js json ./test/inputs/$i/in.md -O0 > ./test/inputs/$i/wizard-noopt.json &
    ./bin/madwizard.js plan ./test/inputs/$i/in.md --no-aprioris > ./test/inputs/$i/tree-noaprioris.txt &
    ./bin/madwizard.js json ./test/inputs/$i/in.md --no-aprioris > ./test/inputs/$i/wizard-noaprioris.json &
    wait
done

echo B
for i in {1..8} {11..18} {20..22} {24..25}
do
    ./bin/madwizard.js plan ./test/inputs/$i/in.md > ./test/inputs/$i/tree.txt &
    ./bin/madwizard.js json ./test/inputs/$i/in.md > ./test/inputs/$i/wizard.json &
    wait
done

echo C
for i in 9 10 19 23
do
    for platform in darwin linux win32
    do
        ./bin/madwizard.js plan ./test/inputs/$i/in.md --assert=madwizard/apriori/platform=$platform > ./test/inputs/$i/tree-$platform.txt &
        ./bin/madwizard.js json ./test/inputs/$i/in.md --assert=madwizard/apriori/platform=$platform > ./test/inputs/$i/wizard-$platform.json &
    done
    wait
done

