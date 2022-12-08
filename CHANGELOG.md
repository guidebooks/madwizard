## [2.2.4](https://github.com/guidebooks/madwizard/compare/2.2.3...2.2.4) (2022-12-08)

### Bug Fixes

- madwizard-cli should not have a postinstall script ([cf768c1](https://github.com/guidebooks/madwizard/commit/cf768c1ff97669071fef85a053c69217d386fabd))

## [2.2.3](https://github.com/guidebooks/madwizard/compare/2.2.2...2.2.3) (2022-12-08)

### Bug Fixes

- madwizard-cli should have a devdep on @guidebooks/store ([7fe3082](https://github.com/guidebooks/madwizard/commit/7fe3082af2a5c91b811ca6d961a4e280ca729888))

## [2.2.2](https://github.com/guidebooks/madwizard/compare/2.2.1...2.2.2) (2022-12-08)

## [2.2.1](https://github.com/guidebooks/madwizard/compare/2.2.0...2.2.1) (2022-12-08)

### Bug Fixes

- remove leftover copy of version.json ([69cc569](https://github.com/guidebooks/madwizard/commit/69cc5697d2454860a9648d61cb481257507fe9e7))

# [2.2.0](https://github.com/guidebooks/madwizard/compare/2.1.0...2.2.0) (2022-12-08)

### Bug Fixes

- avoid a version.json file ([74b77ba](https://github.com/guidebooks/madwizard/commit/74b77bae3d2512dbed12d0b07509fa55fdd16a5d))
- avoid dynamic import of madwizard in madwizard-cli ([219ce2d](https://github.com/guidebooks/madwizard/commit/219ce2d2479e6258ea5877f8d01780b5a5e181f6))
- improve logic for initial clear screen ([cca9d27](https://github.com/guidebooks/madwizard/commit/cca9d2740d0516b2de5a40ef041b7564a5fd0881))

### Features

- use esbuild to bundle an optimized madwizard-cli ([d6b003e](https://github.com/guidebooks/madwizard/commit/d6b003eaca9409bd916168f3ada858a2f230dfae))

# [2.1.0](https://github.com/guidebooks/madwizard/compare/2.0.4...2.1.0) (2022-12-07)

### Features

- expose `Parser.inlineSnippets()` ([91d59b0](https://github.com/guidebooks/madwizard/commit/91d59b0de4827b4304ca90bf314ba9afbdfeba06))

## [2.0.4](https://github.com/guidebooks/madwizard/compare/2.0.3...2.0.4) (2022-12-06)

### Bug Fixes

- move changelog management back to top-level ([d6d6cb2](https://github.com/guidebooks/madwizard/commit/d6d6cb27a61db2fe9b90823829c89312daebea9d))

## [2.0.3](https://github.com/guidebooks/madwizard/compare/2.0.2...2.0.3) (2022-12-06)

Changelog:

- fix: packages/madwizard should build prior to packing (4c1cc52)
- chore: remove bin from top-level package.json (e33a13b)
- fix: move npmignore into packages/madwizard (f78e60d)

## [2.0.2](https://github.com/guidebooks/madwizard/compare/2.0.1...2.0.2) (2022-12-06)

no changes

## [2.0.1](https://github.com/guidebooks/madwizard/compare/2.0.0...2.0.1) (2022-12-06)

no changes

## [2.0.0](https://github.com/guidebooks/madwizard/compare/1.10.3...2.0.0) (2022-12-06)

### Bug Fixes

- graph formation fails for top-level code blocks ([f40575b](https://github.com/guidebooks/madwizard/commit/f40575ba709c3e6d7490a149da18b317067eeaaa))

### Features

- refactor into npm workspaces ([9ce3cf8](https://github.com/guidebooks/madwizard/commit/9ce3cf84f33ca11ba12a71f38796c3e95d1eeab2))

### BREAKING CHANGES

Note: the `madwizard` CLI will now be published in the `madwizard-cli` npm.

## [1.10.3](https://github.com/guidebooks/madwizard/compare/1.10.2...1.10.3) (2022-12-04)

### Bug Fixes

- choice descriptions with non-plain text may be cropped ([a1872ec](https://github.com/guidebooks/madwizard/commit/a1872ecdb10670a62d5348cf341108f2aaa915fe))
- relative imports chained off an implicit .../index file are broken ([3a5c215](https://github.com/guidebooks/madwizard/commit/3a5c215f890a93499ceb78b6b3eff0c189b871b7))
- when snippet fetch fails, help user set up debug output ([cad6834](https://github.com/guidebooks/madwizard/commit/cad6834d6b48106006796903d3e43836641ecbc8))

## [1.10.2](https://github.com/guidebooks/madwizard/compare/1.10.1...1.10.2) (2022-12-02)

### Bug Fixes

- choice expansion fails for commands that contain commas ([d1ea652](https://github.com/guidebooks/madwizard/commit/d1ea6522553ac889ec683f89dd9aef7b978f176a))

## [1.10.1](https://github.com/guidebooks/madwizard/compare/1.9.1...1.10.1) (2022-12-01)

### Bug Fixes

- restore prepack ([1260320](https://github.com/guidebooks/madwizard/commit/1260320f2e371287d692eecafa75d89bc7ae7cb5))

### Features

- allow guidebooks to specify a choice via env var ([b61305c](https://github.com/guidebooks/madwizard/commit/b61305c71ac021a1010b2de6ff00d8e07681c8ce))
- ray-submit should activate a venv if RAY_VENV_PATH is defined ([fcd9939](https://github.com/guidebooks/madwizard/commit/fcd99391326305aa295f11ef3ef7452ef1c7ae27))

## [1.9.1](https://github.com/guidebooks/madwizard/compare/1.9.0...1.9.1) (2022-11-23)

### Bug Fixes

- make sure to redact RAY_ADDRESS env var ([d28db32](https://github.com/guidebooks/madwizard/commit/d28db3232ab2785bb9ce609cdbf170ca04cd5d1a))

# [1.9.0](https://github.com/guidebooks/madwizard/compare/1.8.5...1.9.0) (2022-11-22)

### Features

- add `onBeforeRun` support, to allow cleanup registration ([8e0375b](https://github.com/guidebooks/madwizard/commit/8e0375ba68492041b1ffdb2d1ada29ed4eabc96c))

## [1.8.5](https://github.com/guidebooks/madwizard/compare/1.8.4...1.8.5) (2022-11-21)

### Bug Fixes

- do not initially clear when in raw mode ([fa9c8d2](https://github.com/guidebooks/madwizard/commit/fa9c8d2b64b050e5ac5c75fda6a02df7ad5e1424))

## [1.8.4](https://github.com/guidebooks/madwizard/compare/1.8.3...1.8.4) (2022-11-21)

### Bug Fixes

- do not initially display guidebook title when in raw mode ([c793451](https://github.com/guidebooks/madwizard/commit/c793451a153e41a3f96af8c432eacf469a6fdf65))

## [1.8.3](https://github.com/guidebooks/madwizard/compare/1.8.2...1.8.3) (2022-11-18)

### Bug Fixes

- restore prepack ([1847d58](https://github.com/guidebooks/madwizard/commit/1847d589ddbae151426e9f0b2159d680a897ec09))

## [1.8.2](https://github.com/guidebooks/madwizard/compare/1.8.1...1.8.2) (2022-11-18)

### Bug Fixes

- improved descriptions for nested imported guidebooks ([573c885](https://github.com/guidebooks/madwizard/commit/573c88577888086353a347504da009f5e88e6abe))

## [1.8.1](https://github.com/guidebooks/madwizard/compare/1.8.0...1.8.1) (2022-11-17)

### Bug Fixes

- restore prepack ([630aa85](https://github.com/guidebooks/madwizard/commit/630aa8576fc816d13ebfc8bfd20c1605ddec0ae8))

# [1.8.0](https://github.com/guidebooks/madwizard/compare/1.7.3...1.8.0) (2022-11-17)

### Features

- propagate description to Choice model ([33f61ff](https://github.com/guidebooks/madwizard/commit/33f61ff037419f2e1790c44eb54051742d340a43))

## [1.7.3](https://github.com/guidebooks/madwizard/compare/1.7.2...1.7.3) (2022-11-13)

## [1.7.2](https://github.com/guidebooks/madwizard/compare/1.7.1...1.7.2) (2022-11-11)

### Bug Fixes

- add sourcemaps ([64041b6](https://github.com/guidebooks/madwizard/commit/64041b6d6115cbbb250b6cf952196bad96531613))
- restore prepack script ([251ad25](https://github.com/guidebooks/madwizard/commit/251ad256a9b6f0b1e1e5b0721299639760707f25))

## [1.7.1](https://github.com/guidebooks/madwizard/compare/1.7.0...1.7.1) (2022-11-11)

### Bug Fixes

- improve exporting of enquirer type overrides ([2ab83c3](https://github.com/guidebooks/madwizard/commit/2ab83c3608b3376eabfd86b6b184020577381c9f))

# [1.7.0](https://github.com/guidebooks/madwizard/compare/1.6.5...1.7.0) (2022-11-10)

### Bug Fixes

- add small comment to exec/shell ([aeeb5de](https://github.com/guidebooks/madwizard/commit/aeeb5de31acdfe0c31a4ceb1c6210a7c9e00c972))

### Features

- add support for emitting choices as raw json rather than via enquirer ([dfc0379](https://github.com/guidebooks/madwizard/commit/dfc0379de565353ec57e1ae3c4698013f3752c23))

## [1.6.5](https://github.com/guidebooks/madwizard/compare/1.6.4...1.6.5) (2022-10-26)

### Bug Fixes

- only show the 'spacebar selects enter accepts' message for multi-select choices ([44892b4](https://github.com/guidebooks/madwizard/commit/44892b477a662addcefae73c12d529970a7486a2))

## [1.6.4](https://github.com/guidebooks/madwizard/compare/1.6.3...1.6.4) (2022-10-08)

### Bug Fixes

- graph optimizer can result in out of order execution ([f4bc8b9](https://github.com/guidebooks/madwizard/commit/f4bc8b9a4e40b1feccdc2401b88c1325d8d8024f)), closes [#458](https://github.com/guidebooks/madwizard/issues/458)

## [1.6.3](https://github.com/guidebooks/madwizard/compare/1.6.2...1.6.3) (2022-10-06)

### Bug Fixes

- multiselect validator is incorrectly applied to single-select ([da419c4](https://github.com/guidebooks/madwizard/commit/da419c4dc1e56dec180ce5731de15fb3b7ce8957))

## [1.6.2](https://github.com/guidebooks/madwizard/compare/1.6.1...1.6.2) (2022-10-06)

### Bug Fixes

- multiselect should validate and fail if user has selected nothing ([c82bd6f](https://github.com/guidebooks/madwizard/commit/c82bd6f4d63a6b7fbacc04594e2d51631eff8b74))

## [1.6.1](https://github.com/guidebooks/madwizard/compare/1.6.0...1.6.1) (2022-10-05)

### Bug Fixes

- a choice whose value includes ~/ does not get expanded to homedir ([e3f0bf6](https://github.com/guidebooks/madwizard/commit/e3f0bf630fab9251c909de29e1399d6211fa8a5b))

# [1.6.0](https://github.com/guidebooks/madwizard/compare/1.5.0...1.6.0) (2022-10-03)

### Features

- `Profiles.createIfNeeded()` creates an empty profile if none exists ([a2e83a5](https://github.com/guidebooks/madwizard/commit/a2e83a5f1efb12cc84601842a184f89fe67f568d))

# [1.5.0](https://github.com/guidebooks/madwizard/compare/1.4.2...1.5.0) (2022-10-01)

### Features

- support for "checkbox" multiselect choices ([8bb0d9b](https://github.com/guidebooks/madwizard/commit/8bb0d9ba54bb7fb446e7b5f8bacd2436d7c5b6be))

## [1.4.2](https://github.com/guidebooks/madwizard/compare/1.4.1...1.4.2) (2022-10-01)

### Bug Fixes

- avoid glaring yellow colors in guide ([1fd2689](https://github.com/guidebooks/madwizard/commit/1fd268940ffeaab6d7e5a6844c9b451a67da3373))

## [1.4.1](https://github.com/guidebooks/madwizard/compare/1.3.2...1.4.1) (2022-10-01)

### Bug Fixes

- restore prepack ([531e96a](https://github.com/guidebooks/madwizard/commit/531e96a5be2af1c9a9de2d6236cec4689cc59c67))

### Features

- allow clients to request only clearing for the initial question ([bddd0ec](https://github.com/guidebooks/madwizard/commit/bddd0ec44f9e1df3cda161c4da36264a1ff7c678))

## [1.3.2](https://github.com/guidebooks/madwizard/compare/1.3.1...1.3.2) (2022-09-29)

### Bug Fixes

- the very last choice may not be persisted ([6f20b6c](https://github.com/guidebooks/madwizard/commit/6f20b6c7fbaab8afbbc90530ebc047fb1d3df5b7))

## [1.3.1](https://github.com/guidebooks/madwizard/compare/1.3.0...1.3.1) (2022-09-29)

### Bug Fixes

- restore deleted prepack ([73151a4](https://github.com/guidebooks/madwizard/commit/73151a4fc36d68a03c20221856eb320cb372c9ab))

# [1.3.0](https://github.com/guidebooks/madwizard/compare/1.2.0...1.3.0) (2022-09-29)

### Features

- add `Profiles.touch()` to bump the `lastUsedTime` attribute ([1fae625](https://github.com/guidebooks/madwizard/commit/1fae6258cde6247c7ef398c4d9cee8ff217751b4))

# [1.2.0](https://github.com/guidebooks/madwizard/compare/1.1.0...1.2.0) (2022-09-28)

### Features

- `Profiles.reset(profileName)` api ([adb0c30](https://github.com/guidebooks/madwizard/commit/adb0c3048cf362498ec4785356132c65213d70b0))

# [1.1.0](https://github.com/guidebooks/madwizard/compare/1.0.3...1.1.0) (2022-09-27)

### Bug Fixes

- group expansion nested under a choice can result in an infinite loop ([76957c2](https://github.com/guidebooks/madwizard/commit/76957c27af6f0489424c56c30d7aaa80c3d8bed6))

### Features

- new `--ifor` option (interactive only for a given guidebook) ([a81301a](https://github.com/guidebooks/madwizard/commit/a81301af40dcb462e25e521007cc83b9babe2cfa))

## [1.0.3](https://github.com/guidebooks/madwizard/compare/1.0.2...1.0.3) (2022-09-26)

### Bug Fixes

- improved protection against pushing to non-array ([3884df6](https://github.com/guidebooks/madwizard/commit/3884df642515577c1a84bd0015a22f6a3caad738))

## [1.0.2](https://github.com/guidebooks/madwizard/compare/1.0.1...1.0.2) (2022-09-25)

### Bug Fixes

- restore prepack script ([34d1716](https://github.com/guidebooks/madwizard/commit/34d17167b9cbe87f709fe44a78567f0d3f9d55a9))

## [1.0.1](https://github.com/guidebooks/madwizard/compare/1.0.0...1.0.1) (2022-09-25)

### Bug Fixes

- regressions in handling of localhost aprioris ([4f307e4](https://github.com/guidebooks/madwizard/commit/4f307e43e5393ebba2cf55b63491bdee87936168))

# [1.0.0](https://github.com/guidebooks/madwizard/compare/0.23.5...1.0.0) (2022-09-24)

### Features

- improved keys for remembering choices in profiles ([406e970](https://github.com/guidebooks/madwizard/commit/406e97087766665bca3f765cf50fe92bc092bbe5))

### BREAKING CHANGES

- this changes the keys used in profiles to remember the choices made. The goal here is to avoid using the internal representation of the choice group -- we have been using the text of the tabs/choices to represent the choice itself. this is very hard to maintain, as it means every small change to the text of the tab results in undoing the choice the user made.

## [0.23.5](https://github.com/guidebooks/madwizard/compare/0.23.4...0.23.5) (2022-09-23)

### Reverts

- Revert "fix: statusMemo is not properly invalidated" ([edcb944](https://github.com/guidebooks/madwizard/commit/edcb94482b1d109bc101dfe4b8797eaccd9eacd7))
- Revert "fix: restore accidentally removed prepack script" ([452ae0b](https://github.com/guidebooks/madwizard/commit/452ae0b662b1410ab7c6203b783be232125c0844))
- Revert "fix: more fixes for status memo invalidation" ([f29c391](https://github.com/guidebooks/madwizard/commit/f29c3911954a02e2b0729c6621d6f8336bc37ef0))

## [0.23.4](https://github.com/guidebooks/madwizard/compare/0.23.3...0.23.4) (2022-09-22)

### Bug Fixes

- more fixes for status memo invalidation ([a1a2bd0](https://github.com/guidebooks/madwizard/commit/a1a2bd0122bece7bdeeedb7fa07436c1cce79037))
- restore accidentally removed prepack script ([e6ef80b](https://github.com/guidebooks/madwizard/commit/e6ef80b568d7e00b04f9ee06ae759cf875c2d5bc))

## [0.23.3](https://github.com/guidebooks/madwizard/compare/0.23.2...0.23.3) (2022-09-22)

## [0.23.2](https://github.com/guidebooks/madwizard/compare/0.23.1...0.23.2) (2022-09-22)

### Bug Fixes

- statusMemo is not properly invalidated ([71ed5ac](https://github.com/guidebooks/madwizard/commit/71ed5acf25f641964be1890c42feeb3e57813316))

## [0.23.1](https://github.com/guidebooks/madwizard/compare/0.23.0...0.23.1) (2022-09-20)

### Bug Fixes

- expose existing profile delete logic as Profiles.delete ([424f42b](https://github.com/guidebooks/madwizard/commit/424f42b5bda765fbc08071cf10f23b364f64f30c))

# [0.23.0](https://github.com/guidebooks/madwizard/compare/0.22.2...0.23.0) (2022-09-19)

### Features

- add --no-bump CLI option to avoid bumping lastUsedTime ([e2fa62f](https://github.com/guidebooks/madwizard/commit/e2fa62f9c2fe76cb55bf002df8712b0a8f7c1179))

## [0.22.2](https://github.com/guidebooks/madwizard/compare/0.22.1...0.22.2) (2022-09-16)

### Bug Fixes

- use `windowsHide: true` for subprocess execution ([c334013](https://github.com/guidebooks/madwizard/commit/c334013fd918c27bc702757794427e562e9dcec0))

## [0.22.1](https://github.com/guidebooks/madwizard/compare/0.22.0...0.22.1) (2022-09-14)

### Bug Fixes

- broken variable expansions for users with zsh as their shell ([e554caa](https://github.com/guidebooks/madwizard/commit/e554caa9c9e0c467e408d836b45bba9ad53c6196))

# [0.22.0](https://github.com/guidebooks/madwizard/compare/0.21.7...0.22.0) (2022-09-07)

### Bug Fixes

- stop publishing the guidebook store to npm ([c70de20](https://github.com/guidebooks/madwizard/commit/c70de200876081086dfd4cd00a38b4dca6cbf119))

## [0.21.7](https://github.com/guidebooks/madwizard/compare/0.21.6...0.21.7) (2022-09-05)

### Bug Fixes

- add missing Choices.getKey() ([7780e1b](https://github.com/guidebooks/madwizard/commit/7780e1b88ad15bb2663107ec3a43530a6e8a440c))

## [0.21.6](https://github.com/guidebooks/madwizard/compare/0.21.5...0.21.6) (2022-09-05)

## [0.21.5](https://github.com/guidebooks/madwizard/compare/0.21.4...0.21.5) (2022-08-31)

### Bug Fixes

- another fix for ray-submit vs python ([14204df](https://github.com/guidebooks/madwizard/commit/14204dfda3adec8ffdf2f36d1ac984b47bf49b69))

## [0.21.4](https://github.com/guidebooks/madwizard/compare/0.21.3...0.21.4) (2022-08-30)

### Bug Fixes

- regression in ray-submit intrinsic for python ([a355205](https://github.com/guidebooks/madwizard/commit/a35520534fff5c8a397b3211fc361a7ae00ddd80))

## [0.21.3](https://github.com/guidebooks/madwizard/compare/0.21.2...0.21.3) (2022-08-28)

### Bug Fixes

- minor fixes for ray-submit --no-input ([d106163](https://github.com/guidebooks/madwizard/commit/d106163b82ee075cb3dbe303be0eca3daf524fd8))

## [0.21.2](https://github.com/guidebooks/madwizard/compare/0.21.1...0.21.2) (2022-08-27)

### Bug Fixes

- regression in ray-submit for cases that need an input file ([f87b515](https://github.com/guidebooks/madwizard/commit/f87b515e26833c09992065cad7c8025efa0542a6))

## [0.21.1](https://github.com/guidebooks/madwizard/compare/0.21.0...0.21.1) (2022-08-26)

### Bug Fixes

- ray-submit intrinsic mishandles non-python entrypoints ([7e695b2](https://github.com/guidebooks/madwizard/commit/7e695b2c269b8df41ab5018e1dd07d985d1a502d))

# [0.21.0](https://github.com/guidebooks/madwizard/compare/0.20.0...0.21.0) (2022-08-25)

### Features

- allow assertions to be passed programmatically ([08ddc9f](https://github.com/guidebooks/madwizard/commit/08ddc9f371d649bc029d759798cd5d0a10507251))

# [0.20.0](https://github.com/guidebooks/madwizard/compare/0.19.6...0.20.0) (2022-08-24)

### Bug Fixes

- leftover regressions for noopt and no-aproprioris from yargs-parser switchover ([6334782](https://github.com/guidebooks/madwizard/commit/633478212772572c26e79282cee0b0cdc631ef32))

### Features

- allow assertions to use regexp patterns ([4061ad9](https://github.com/guidebooks/madwizard/commit/4061ad9e96bb716e47da5db2f15a2c0abddedf5e))

## [0.19.6](https://github.com/guidebooks/madwizard/compare/0.19.5...0.19.6) (2022-08-23)

### Bug Fixes

- only call ray job stop onExit if we are terminating abnormally ([98cdaa1](https://github.com/guidebooks/madwizard/commit/98cdaa16bc3df670939fb7c795831b4e1f74e67d))

## [0.19.5](https://github.com/guidebooks/madwizard/compare/0.19.4...0.19.5) (2022-08-22)

### Bug Fixes

- `$uuid` replacement fails for `${FOO-$uuid}` ([a2e502a](https://github.com/guidebooks/madwizard/commit/a2e502a20484912fc9cad67dd81f2a14c9155a34))
