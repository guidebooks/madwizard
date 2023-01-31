## [5.0.5](https://github.com/guidebooks/madwizard/compare/5.0.4...5.0.5) (2023-01-31)

### Bug Fixes

- handled-by-client execs should be passed through the `exec` attr ([f0a5a7c](https://github.com/guidebooks/madwizard/commit/f0a5a7c566bc526ab575bf98ce95481e4501a4ae))

## [5.0.4](https://github.com/guidebooks/madwizard/compare/5.0.3...5.0.4) (2023-01-30)

### Bug Fixes

- exec should trust client more broadly ([79e4bdc](https://github.com/guidebooks/madwizard/commit/79e4bdcc0699ba4bacc33c83080d2e2ef268e4d1))

## [5.0.3](https://github.com/guidebooks/madwizard/compare/5.0.2...5.0.3) (2023-01-24)

### Bug Fixes

- favor handleByClient in exec ([8b3ba48](https://github.com/guidebooks/madwizard/commit/8b3ba48995adebdabb61cde82d16e626746bec91))
- improve tracking of madwizard-internal command executions ([1e40a75](https://github.com/guidebooks/madwizard/commit/1e40a754d2044772ec5d414ad74970c307acef43))

## [5.0.2](https://github.com/guidebooks/madwizard/compare/5.0.1...5.0.2) (2023-01-24)

### Bug Fixes

- shell.exec should allow mixed primitive arrays ([e9b7023](https://github.com/guidebooks/madwizard/commit/e9b7023080ee916f05b129ab0217734a7006cf1b))

## [5.0.1](https://github.com/guidebooks/madwizard/compare/5.0.0...5.0.1) (2023-01-24)

### Bug Fixes

- client-provided shell.exec should be allowed to return other primitive types ([4a9cd90](https://github.com/guidebooks/madwizard/commit/4a9cd90d799c446e4941fe29407c449823ddea58))

# [5.0.0](https://github.com/guidebooks/madwizard/compare/4.7.2...5.0.0) (2023-01-24)

### Bug Fixes

- guidebook without codeblocks causes null pointer exceptions ([ec6bea2](https://github.com/guidebooks/madwizard/commit/ec6bea28fd320cadd0a0c50fdb5915e97128eca7))

### Features

- support choice expansion via the client's `shell` ([b9fb2f4](https://github.com/guidebooks/madwizard/commit/b9fb2f434649f5c61ba6de042152761db1c6f2b8))

### BREAKING CHANGES

- This removes untested and unused `exec` support in the Graph submodule.

## [4.7.2](https://github.com/guidebooks/madwizard/compare/4.7.1...4.7.2) (2023-01-23)

### Bug Fixes

- readline -> node:readline ([4288496](https://github.com/guidebooks/madwizard/commit/42884960256e65dd2391f4375667744c1b316286))

## [4.7.1](https://github.com/guidebooks/madwizard/compare/4.7.0...4.7.1) (2023-01-23)

### Bug Fixes

- remove use of readline ([9d1d349](https://github.com/guidebooks/madwizard/commit/9d1d349c58e998f498a691f32ddd90433c9ecc36))

# [4.7.0](https://github.com/guidebooks/madwizard/compare/4.6.0...4.7.0) (2023-01-23)

### Features

- switch enquirer from readline to keypress-browserify ([76024f6](https://github.com/guidebooks/madwizard/commit/76024f675d3a64e73b5bffd382a2ae177700b4bb))

# [4.6.0](https://github.com/guidebooks/madwizard/compare/4.5.0...4.6.0) (2023-01-22)

### Features

- allow clients to provide a stdio=stdin+stdout ([6fe5532](https://github.com/guidebooks/madwizard/commit/6fe553266fb2fc6375e22507e7db85477f50fb9a))

# [4.5.0](https://github.com/guidebooks/madwizard/compare/4.4.0...4.5.0) (2023-01-19)

### Bug Fixes

- guidebooks with finally blocks may result in choice description ::::: ([a8c37d9](https://github.com/guidebooks/madwizard/commit/a8c37d90dbd72c8df2994cfc4a4c5570c0023a19))

### Features

- improved support for running in browser ([fc44f62](https://github.com/guidebooks/madwizard/commit/fc44f62b970a88b3a99ab441ab53c127b4a1b844))

# [4.4.0](https://github.com/guidebooks/madwizard/compare/4.3.5...4.4.0) (2023-01-18)

### Bug Fixes

- ray working directory does not handle cwd-relative paths ([d1f8db4](https://github.com/guidebooks/madwizard/commit/d1f8db41e272fd23eacc4b7ec4cd3f32c3bdadca))

### Features

- bump to latest @guidebooks/store@2.1.2 ([00c9bf0](https://github.com/guidebooks/madwizard/commit/00c9bf01741e9e5c4be2569d051088bf8467fecd))

## [4.3.5](https://github.com/guidebooks/madwizard/compare/4.3.4...4.3.5) (2023-01-17)

## [4.3.4](https://github.com/guidebooks/madwizard/compare/4.3.3...4.3.4) (2023-01-17)

## [4.3.3](https://github.com/guidebooks/madwizard/compare/4.3.2...4.3.3) (2023-01-17)

### Bug Fixes

- guide handler may double-invoke cleanExit ([cce1bd7](https://github.com/guidebooks/madwizard/commit/cce1bd7663af304a7f126f7ca5ab6a43298d6cf6))

## [4.3.2](https://github.com/guidebooks/madwizard/compare/4.3.1...4.3.2) (2023-01-17)

### Bug Fixes

- bump to '2.3.7' of enquirier starpit fork ([c44b87c](https://github.com/guidebooks/madwizard/commit/c44b87cfac5c03dba90de008a6eb24454efd46d9))

## [4.3.1](https://github.com/guidebooks/madwizard/compare/4.3.0...4.3.1) (2023-01-17)

### Bug Fixes

- SIGINT cleanup should kill guidebook asyncs right away ([69210b8](https://github.com/guidebooks/madwizard/commit/69210b8a161c81acd76a1b1061ef57a20faa092f))

# [4.3.0](https://github.com/guidebooks/madwizard/compare/4.2.0...4.3.0) (2023-01-16)

### Features

- execute finally blocks on abnormal (e.g. ctrl+c) termination ([708ad00](https://github.com/guidebooks/madwizard/commit/708ad009120118a840de41e272eaa53b84d3c63a))

# [4.2.0](https://github.com/guidebooks/madwizard/compare/4.1.0...4.2.0) (2023-01-09)

### Bug Fixes

- export Graph.sequence and Graph.sameGraph ([37b1842](https://github.com/guidebooks/madwizard/commit/37b18427ba60569379f44994ca6acb6c7a72d85e))

### Features

- **packages/madwizard-cli:** bump to store 1.11.1 to pick up image pull secret fix ([5b7f32d](https://github.com/guidebooks/madwizard/commit/5b7f32d2845bb5dc36409e464109651e018e9934))

# [4.1.0](https://github.com/guidebooks/madwizard/compare/4.0.3...4.1.0) (2023-01-09)

### Bug Fixes

- export results in 'undefined' values for empty strings ([193449b](https://github.com/guidebooks/madwizard/commit/193449b507a97e93d0860b17c3dd25061b8cae79))

### Features

- finally block support ([f8ca3d5](https://github.com/guidebooks/madwizard/commit/f8ca3d5a447d7158d5c94fe3f2ca748157000c89))
- **packages/madwizard-cli:** bump to store 1.11.0 to pick up image pull secret ([375ed65](https://github.com/guidebooks/madwizard/commit/375ed65d3b81def8c52e10286aa0f5254a94ce51))

## [4.0.3](https://github.com/guidebooks/madwizard/compare/4.0.2...4.0.3) (2023-01-09)

### Bug Fixes

- another fix for --yes support ([06c6599](https://github.com/guidebooks/madwizard/commit/06c65991418c8791128060ef5fc318bb5ae03fee))
- ray-submit intrinsic does not use venv for ray job stop command ([fc81d53](https://github.com/guidebooks/madwizard/commit/fc81d53c37529437dc6350ff5c239ef225b30d35))

## [4.0.2](https://github.com/guidebooks/madwizard/compare/4.0.1...4.0.2) (2023-01-08)

### Bug Fixes

- guide interactive mode detection is buggy ([59e14b8](https://github.com/guidebooks/madwizard/commit/59e14b8afe04c115d8465a98917a2be1e2ca5efa))

## [4.0.1](https://github.com/guidebooks/madwizard/compare/4.0.0...4.0.1) (2023-01-06)

### Bug Fixes

- -y option was not working as intended ([8b14fde](https://github.com/guidebooks/madwizard/commit/8b14fde18c907e9aa6bd058e446b0a73477c673b))
- add missing madwizard binary for madwizard-cli-core published npm ([cd6562a](https://github.com/guidebooks/madwizard/commit/cd6562aea08551a30e9b42268f1a43e00c2d281d))
- improved fix for multiple choices in a single file ([fdf5192](https://github.com/guidebooks/madwizard/commit/fdf51924ac2f85a7948f33ccc8381cc9a270c1cf)), closes [#581](https://github.com/guidebooks/madwizard/issues/581)

# [4.0.0](https://github.com/guidebooks/madwizard/compare/3.1.2...4.0.0) (2023-01-06)

### Bug Fixes

- switch programmatic input from `input: string` to `vfile: VFile` ([ea1ac70](https://github.com/guidebooks/madwizard/commit/ea1ac70fa4488c0132fec12670d81d6a673c02df))

### BREAKING CHANGES

- this is to allow for specifying the filepath of the programmatic input.

## [3.1.2](https://github.com/guidebooks/madwizard/compare/3.1.1...3.1.2) (2023-01-05)

### Bug Fixes

- suboptimal workaround for multiple choices in a single file ([24ed4e2](https://github.com/guidebooks/madwizard/commit/24ed4e2345c9ff594a7dd6d97ae37f7700039c3a))

## [3.1.1](https://github.com/guidebooks/madwizard/compare/3.1.0...3.1.1) (2023-01-05)

### Bug Fixes

- remove leftover debugging output ([72c6ee2](https://github.com/guidebooks/madwizard/commit/72c6ee28a82747e8bfb64bb67cd581565ce8ccc8))

# [3.1.0](https://github.com/guidebooks/madwizard/compare/3.0.0...3.1.0) (2023-01-05)

### Features

- allow clients to intercept shell executions ([d8ebde5](https://github.com/guidebooks/madwizard/commit/d8ebde58ef05fcc09e567ba5fcfdbbe692027df6))

# [3.0.0](https://github.com/guidebooks/madwizard/compare/2.6.0...3.0.0) (2023-01-04)

### Features

- allow clients to pass in a raw api callback function ([a759a89](https://github.com/guidebooks/madwizard/commit/a759a89d61e755f32881c9d5d633b0aace4fd56e))

### BREAKING CHANGES

- previously, the `raw` parameter was a boolean, and the "raw prefix" was specified via a separate option. With this PR, `raw` is now either a string (in which case it serves the role of raw prefix); or a function (in which case the alternate callback API is used).

# [2.6.0](https://github.com/guidebooks/madwizard/compare/2.5.3...2.6.0) (2023-01-04)

### Features

- support input from stdin and passed programmatically ([c175bc4](https://github.com/guidebooks/madwizard/commit/c175bc4a52129c86ff9d2e64136031b4a8c4c255))

## [2.5.3](https://github.com/guidebooks/madwizard/compare/2.5.2...2.5.3) (2023-01-03)

### Bug Fixes

- is not expanded for non-forms ([ffe8c53](https://github.com/guidebooks/madwizard/commit/ffe8c53189f969cafcbef274ca593996f9e07f67))

## [2.5.2](https://github.com/guidebooks/madwizard/compare/2.5.1...2.5.2) (2022-12-25)

### Bug Fixes

- multiselect fails if prior choices are not valid choices in latest guidebook ([9911072](https://github.com/guidebooks/madwizard/commit/991107237c80207d190d08086a981f217cd09ca5))

## [2.5.1](https://github.com/guidebooks/madwizard/compare/2.5.0...2.5.1) (2022-12-24)

### Bug Fixes

- missing typing for string[] answers from multiselect ([2a1a955](https://github.com/guidebooks/madwizard/commit/2a1a955879833a1f03e6ba9b0e20c868763731fc))

# [2.5.0](https://github.com/guidebooks/madwizard/compare/2.4.11...2.5.0) (2022-12-21)

### Features

- remove fancy code highlighting from AnsiUI ([efd8531](https://github.com/guidebooks/madwizard/commit/efd853157b8cb5a668d9f3c3cb563615abe9c6b6))

## [2.4.11](https://github.com/guidebooks/madwizard/compare/2.4.10...2.4.11) (2022-12-21)

### Bug Fixes

- Profiles does not export Profile type ([d1fd6e3](https://github.com/guidebooks/madwizard/commit/d1fd6e3d45c971fa4c6ea010fecaacaa43b14d3f))

## [2.4.10](https://github.com/guidebooks/madwizard/compare/2.4.9...2.4.10) (2022-12-21)

### Bug Fixes

- madwizard-cli-core is not publishing dist ([1ec9c5b](https://github.com/guidebooks/madwizard/commit/1ec9c5b7ab178a90063eb57f41b3f2fcf70e3050))
- minor performance tweak to Profile ([db6dd35](https://github.com/guidebooks/madwizard/commit/db6dd35a31c026cc15c0acccb789e1ef44da8f0e))

## [2.4.9](https://github.com/guidebooks/madwizard/compare/2.4.8...2.4.9) (2022-12-16)

### Bug Fixes

- guide export `cleanExit()` method needs to accept a signal parameter ([b623626](https://github.com/guidebooks/madwizard/commit/b623626ec20447a7de4c847f3f6aeef41c554a0a))
- improve return type of `cli` export ([3ed3633](https://github.com/guidebooks/madwizard/commit/3ed363345fc4a013b9d1b865348fedf8817f7eda))

## [2.4.8](https://github.com/guidebooks/madwizard/compare/2.4.7...2.4.8) (2022-12-15)

## [2.4.7](https://github.com/guidebooks/madwizard/compare/2.4.6...2.4.7) (2022-12-13)

### Bug Fixes

- improve error reporting of 'guidebook not found' case ([8aef1fd](https://github.com/guidebooks/madwizard/commit/8aef1fdd83bcfbeb4bff8f247b3fed36d7a29594))

## [2.4.6](https://github.com/guidebooks/madwizard/compare/2.4.5...2.4.6) (2022-12-12)

### Bug Fixes

- undo an EOL change from prior commit ([13772d8](https://github.com/guidebooks/madwizard/commit/13772d860d5480bc5c757b9fc4e683fc251d2491))

## [2.4.5](https://github.com/guidebooks/madwizard/compare/2.4.4...2.4.5) (2022-12-12)

### Bug Fixes

- improved fix for up/down arrow sometimes causing funky scrolling ([d91493a](https://github.com/guidebooks/madwizard/commit/d91493a4c180796e65ef31fea3791d64873121d1))
- release-it hooks do not rebuild after src/version.ts is bumped ([2c90855](https://github.com/guidebooks/madwizard/commit/2c9085538d94359d85c4c6d4f2b65d16a3899eff))

## [2.4.4](https://github.com/guidebooks/madwizard/compare/2.4.3...2.4.4) (2022-12-12)

### Bug Fixes

- pull in [@starpit](https://github.com/starpit) branch of enquirer to pull in fix for multi-line messages ([2ff0141](https://github.com/guidebooks/madwizard/commit/2ff0141a6ff6cb75088b30007b55ff158ac3c4e6))

## [2.4.3](https://github.com/guidebooks/madwizard/compare/2.4.2...2.4.3) (2022-12-12)

### Bug Fixes

- add profile sub-command descriptions (so they show up in help/usage) ([bea8df7](https://github.com/guidebooks/madwizard/commit/bea8df7d3cc4158f13b1ed4380cfaf8fc10c6d47))
- minor wordsmithing on guide command description ([9d81930](https://github.com/guidebooks/madwizard/commit/9d819303b0a4986a01e0c92f4f82544702601f6f))

## [2.4.2](https://github.com/guidebooks/madwizard/compare/2.4.1...2.4.2) (2022-12-12)

### Bug Fixes

- more cleanup of options, descriptions and underlying code ([c81459a](https://github.com/guidebooks/madwizard/commit/c81459a2bbccbb3f96728a65d61ad79418121a72))

## [2.4.1](https://github.com/guidebooks/madwizard/compare/2.4.0...2.4.1) (2022-12-12)

### Bug Fixes

- build command handler has incorrect argv type ([0d7a05e](https://github.com/guidebooks/madwizard/commit/0d7a05e75b9210963cadfc20245b0a1214c558ba))
- cli fail handler can infinite loop ([4376e26](https://github.com/guidebooks/madwizard/commit/4376e2654a8e03ba4e1f998599e6202ff088d302))
- cli fail handler does not actually work (needs tests) ([b6765b8](https://github.com/guidebooks/madwizard/commit/b6765b8ec7731391d4a3ad0fe00bc12d6c53e5d6))
- group cli options for improved presentation in --help output ([a96191d](https://github.com/guidebooks/madwizard/commit/a96191d61d22755265b08f59f9320c16d9ed1f9a))
- missing .js suffix for an import ([a23908e](https://github.com/guidebooks/madwizard/commit/a23908e732d522894fa67cd203ca7c544c3f3c50))
- properly integrate profile command tree ([f29110e](https://github.com/guidebooks/madwizard/commit/f29110eeaa926641778aea345555142f9a13d02e))
- refine yargs options to restrict number of global options ([67c2e16](https://github.com/guidebooks/madwizard/commit/67c2e16c6e1d4797754f383c27530ea02c35da02))

# [2.4.0](https://github.com/guidebooks/madwizard/compare/2.3.6...2.4.0) (2022-12-10)

### Features

- clean up cli to use yargs and pretty help ([dd9e62c](https://github.com/guidebooks/madwizard/commit/dd9e62cf296c448df4826876159624697c073f43))

## [2.3.6](https://github.com/guidebooks/madwizard/compare/2.3.5...2.3.6) (2022-12-09)

### Bug Fixes

- madwizard-cli's madwizard launcher cannot find min.js ([136fa50](https://github.com/guidebooks/madwizard/commit/136fa5014e073018cb28bd5d8d8eda9539d15e31))

## [2.3.5](https://github.com/guidebooks/madwizard/compare/2.3.4...2.3.5) (2022-12-09)

### Bug Fixes

- madwizard-cli does not expose bin to npm ([82eb500](https://github.com/guidebooks/madwizard/commit/82eb5009252c4988a624e5c8897903b0d1e8bbfe))

## [2.3.4](https://github.com/guidebooks/madwizard/compare/2.3.3...2.3.4) (2022-12-09)

### Bug Fixes

- regression in release-it hook ([e58c71e](https://github.com/guidebooks/madwizard/commit/e58c71eeac789da363455ad1091df63846eecc73))

## [2.3.3](https://github.com/guidebooks/madwizard/compare/2.3.2...2.3.3) (2022-12-09)

### Bug Fixes

- `madwizard` still not available in published `madwizard-cli` ([a79de34](https://github.com/guidebooks/madwizard/commit/a79de34bcfebe2981f9c16b1b73f26ff596b8450))
- avoid manipulating files in release-it's before:init ([8e7988f](https://github.com/guidebooks/madwizard/commit/8e7988f2ebe412ff6b8680d377e26610b4723295))

## [2.3.2](https://github.com/guidebooks/madwizard/compare/2.3.1...2.3.2) (2022-12-09)

### Bug Fixes

- madwizard-cli installed as npm may not expose `madwizard` ([b732359](https://github.com/guidebooks/madwizard/commit/b7323598d860521e9baf9dfaaf779317f4ee28c6))

## [2.3.1](https://github.com/guidebooks/madwizard/compare/2.3.0...2.3.1) (2022-12-08)

### Bug Fixes

- madwizard launcher has leftover debug and points to old madwizard-cli/dist ([eb736bc](https://github.com/guidebooks/madwizard/commit/eb736bc7e894987c93a004e09e59db43ef39f31f))

# [2.3.0](https://github.com/guidebooks/madwizard/compare/2.2.7...2.3.0) (2022-12-08)

### Features

- create new madwizard-cli-core that is the cli without a store dependence ([a18949f](https://github.com/guidebooks/madwizard/commit/a18949f392d1c4896afe657a04d36a9ac04d88f3))

## [2.2.7](https://github.com/guidebooks/madwizard/compare/2.2.6...2.2.7) (2022-12-08)

### Bug Fixes

- move prepublishOnly to release-it before:init ([b1870b6](https://github.com/guidebooks/madwizard/commit/b1870b69b85ace4e247d052db618d22c8853ae5e))

## [2.2.6](https://github.com/guidebooks/madwizard/compare/2.2.5...2.2.6) (2022-12-08)

## [2.2.5](https://github.com/guidebooks/madwizard/compare/2.2.4...2.2.5) (2022-12-08)

### Bug Fixes

- prepack does not properly build madwizard-cli.min.js ([eb5526b](https://github.com/guidebooks/madwizard/commit/eb5526b8bcc2c7dded14c064939829e33f89dc15))

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
