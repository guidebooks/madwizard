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
