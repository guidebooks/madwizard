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
