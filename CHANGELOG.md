## [1.13.7](https://github.com/skrashevich/double-take/compare/v1.13.6...v1.13.7)

AI.Server: Log "no face found" as info #53 (@marq24)

## [1.13.6](https://github.com/skrashevich/double-take/compare/v1.13.5...v1.13.6)

bugfixes

## [1.13.5](https://github.com/skrashevich/double-take/compare/v1.13.4...v1.13.5)

added device_tracker object to mqtt for each recognized person

## [1.13.4](https://github.com/skrashevich/double-take/compare/v1.13.3...v1.13.4)

Return support of arm(64) architectures
bug fixes (again)

## [1.13.3](https://github.com/skrashevich/double-take/compare/v1.13.2...v1.13.3)

Add telegram notifications
bug fixes

## [1.13.2](https://github.com/skrashevich/double-take/compare/v1.13.1...v1.13.2)

Migrate from vue to vite
add ai.server detector
bug fixes

## [1.13.1](https://github.com/jakowenko/double-take/compare/v1.13.0...v1.13.1) (2022-10-27)


### Bug Fixes

* **mqtt:** only retain state and configuration, not events. ([#249](https://github.com/jakowenko/double-take/issues/249)) ([d5de0ee](https://github.com/jakowenko/double-take/commit/d5de0ee8fb60229aa1cf0d4ad974e72009afbff7))

## [1.13.1-beta.1](https://github.com/jakowenko/double-take/compare/v1.13.0...v1.13.1-beta.1) (2022-10-27)


### Bug Fixes

* **mqtt:** only retain state and configuration, not events. ([#249](https://github.com/jakowenko/double-take/issues/249)) ([d5de0ee](https://github.com/jakowenko/double-take/commit/d5de0ee8fb60229aa1cf0d4ad974e72009afbff7))

## [1.13.0](https://github.com/jakowenko/double-take/compare/v1.12.1...v1.13.0) (2022-10-21)


### Features

* frigate matches below an area target ([3365bc7](https://github.com/jakowenko/double-take/commit/3365bc78f893081fe69d784e3d6f968d3be561ce))
* **mqtt & api:** total count for person, match, miss, and unknown ([#223](https://github.com/jakowenko/double-take/issues/223)) ([2bf4406](https://github.com/jakowenko/double-take/commit/2bf4406aa7e92b1b255e95475b5393d7345207e4))
* support for MQTT TLS ([#241](https://github.com/jakowenko/double-take/issues/241)) ([7f37b78](https://github.com/jakowenko/double-take/commit/7f37b78d45f879d782d493595d76a14dbd31b7b5))


### Bug Fixes

* remove non alphanumeric characters from MQTT topic names ([#239](https://github.com/jakowenko/double-take/issues/239)) ([885d8a1](https://github.com/jakowenko/double-take/commit/885d8a112ae34e0f5632f3012a4ed63851cfa2ac))

## [1.13.0-beta.4](https://github.com/jakowenko/double-take/compare/v1.13.0-beta.3...v1.13.0-beta.4) (2022-10-21)


### Features

* **mqtt & api:** total count for person, match, miss, and unknown ([#223](https://github.com/jakowenko/double-take/issues/223)) ([2bf4406](https://github.com/jakowenko/double-take/commit/2bf4406aa7e92b1b255e95475b5393d7345207e4))

## [1.13.0-beta.3](https://github.com/jakowenko/double-take/compare/v1.13.0-beta.2...v1.13.0-beta.3) (2022-10-20)


### Bug Fixes

* remove non alphanumeric characters from MQTT topic names ([#239](https://github.com/jakowenko/double-take/issues/239)) ([885d8a1](https://github.com/jakowenko/double-take/commit/885d8a112ae34e0f5632f3012a4ed63851cfa2ac))

## [1.13.0-beta.2](https://github.com/jakowenko/double-take/compare/v1.13.0-beta.1...v1.13.0-beta.2) (2022-10-20)


### Features

* support for MQTT TLS ([#241](https://github.com/jakowenko/double-take/issues/241)) ([7f37b78](https://github.com/jakowenko/double-take/commit/7f37b78d45f879d782d493595d76a14dbd31b7b5))

## [1.13.0-beta.1](https://github.com/jakowenko/double-take/compare/v1.12.1...v1.13.0-beta.1) (2022-10-19)


### Features

* frigate matches below an area target ([3365bc7](https://github.com/jakowenko/double-take/commit/3365bc78f893081fe69d784e3d6f968d3be561ce))

## [1.12.1](https://github.com/jakowenko/double-take/compare/v1.12.0...v1.12.1) (2022-06-17)


### Bug Fixes

* **opencv:** gracefully fail on error ([84ac482](https://github.com/jakowenko/double-take/commit/84ac482a726012886a6658e5737ff748dce9abd3))

## [1.12.1-beta.1](https://github.com/jakowenko/double-take/compare/v1.12.0...v1.12.1-beta.1) (2022-06-17)


### Bug Fixes

* **opencv:** gracefully fail on error ([84ac482](https://github.com/jakowenko/double-take/commit/84ac482a726012886a6658e5737ff748dce9abd3))

## [1.12.0](https://github.com/jakowenko/double-take/compare/v1.11.0...v1.12.0) (2022-06-13)


### Features

* **api:** opencv preprocess face check ([ed30ad1](https://github.com/jakowenko/double-take/commit/ed30ad10dfe9f6d104619fa134e2d54698b1c1ff))
* aws rekognition support ([7904852](https://github.com/jakowenko/double-take/commit/79048520fd66cb9c4144db11488558b82c8ada19))
* **detectors:** process images from specific cameras ([5d39d0c](https://github.com/jakowenko/double-take/commit/5d39d0c2c18d0851eccd6a8f698638906b0c36b0))
* **frigate:** sort sub labels alphabetically [#217](https://github.com/jakowenko/double-take/issues/217) ([82d8736](https://github.com/jakowenko/double-take/commit/82d8736825b428b2b74385975961233d167db294))
* **frigate:** stop_on_match config option to break process loop ([4b98990](https://github.com/jakowenko/double-take/commit/4b9899077c74da601fa5d497c929c264e8c03fa6))
* **opencv:** adjust classifier settings via config ([2e6c512](https://github.com/jakowenko/double-take/commit/2e6c5129b445b2eca8b884af8d95fc2ceb19733d))
* **ui:** show config errors ([ddcaf89](https://github.com/jakowenko/double-take/commit/ddcaf897ba7f35ac65a6a86a71cbd56a1a9a2a46))
* **ui:** upload images to process with detectors ([f774406](https://github.com/jakowenko/double-take/commit/f774406b540df8ff0eec8b247fee4bd3e02579e1))


### Bug Fixes

* **api:** sleep if image hasn’t changed during retry loop ([78e9808](https://github.com/jakowenko/double-take/commit/78e98082d7e0e77d5c23465cc629b38d9b178a27))
* better handling of update check ([6de1cf1](https://github.com/jakowenko/double-take/commit/6de1cf1dca9e7f244a4242c3c540ef464824bbc3))


### Build

* **deps:** bump outdated packages ([0842d98](https://github.com/jakowenko/double-take/commit/0842d987de25c2a5495cafe73967d30bc96bbe8b))
* workflow dispatch [skip ci] ([a4f6e13](https://github.com/jakowenko/double-take/commit/a4f6e1393f807622d947635acef8b57b92caa6be))

## [1.12.0-beta.6](https://github.com/jakowenko/double-take/compare/v1.12.0-beta.5...v1.12.0-beta.6) (2022-06-13)


### Features

* **ui:** upload images to process with detectors ([f774406](https://github.com/jakowenko/double-take/commit/f774406b540df8ff0eec8b247fee4bd3e02579e1))

## [1.12.0-beta.5](https://github.com/jakowenko/double-take/compare/v1.12.0-beta.4...v1.12.0-beta.5) (2022-06-12)


### Features

* **opencv:** adjust classifier settings via config ([2e6c512](https://github.com/jakowenko/double-take/commit/2e6c5129b445b2eca8b884af8d95fc2ceb19733d))


### Build

* workflow dispatch [skip ci] ([a4f6e13](https://github.com/jakowenko/double-take/commit/a4f6e1393f807622d947635acef8b57b92caa6be))

## [1.12.0-beta.4](https://github.com/jakowenko/double-take/compare/v1.12.0-beta.3...v1.12.0-beta.4) (2022-06-12)


### Bug Fixes

* better handling of update check ([6de1cf1](https://github.com/jakowenko/double-take/commit/6de1cf1dca9e7f244a4242c3c540ef464824bbc3))

## [1.12.0-beta.3](https://github.com/jakowenko/double-take/compare/v1.12.0-beta.2...v1.12.0-beta.3) (2022-06-12)


### Features

* aws rekognition support ([7904852](https://github.com/jakowenko/double-take/commit/79048520fd66cb9c4144db11488558b82c8ada19))

## [1.12.0-beta.2](https://github.com/jakowenko/double-take/compare/v1.12.0-beta.1...v1.12.0-beta.2) (2022-06-12)


### Features

* **api:** opencv preprocess face check ([ed30ad1](https://github.com/jakowenko/double-take/commit/ed30ad10dfe9f6d104619fa134e2d54698b1c1ff))
* **detectors:** process images from specific cameras ([5d39d0c](https://github.com/jakowenko/double-take/commit/5d39d0c2c18d0851eccd6a8f698638906b0c36b0))
* **frigate:** stop_on_match config option to break process loop ([4b98990](https://github.com/jakowenko/double-take/commit/4b9899077c74da601fa5d497c929c264e8c03fa6))
* **ui:** show config errors ([ddcaf89](https://github.com/jakowenko/double-take/commit/ddcaf897ba7f35ac65a6a86a71cbd56a1a9a2a46))


### Bug Fixes

* **api:** sleep if image hasn’t changed during retry loop ([78e9808](https://github.com/jakowenko/double-take/commit/78e98082d7e0e77d5c23465cc629b38d9b178a27))

## [1.12.0-beta.1](https://github.com/jakowenko/double-take/compare/v1.11.0...v1.12.0-beta.1) (2022-06-06)


### Features

* **frigate:** sort sub labels alphabetically [#217](https://github.com/jakowenko/double-take/issues/217) ([82d8736](https://github.com/jakowenko/double-take/commit/82d8736825b428b2b74385975961233d167db294))


### Build

* **deps:** bump outdated packages ([0842d98](https://github.com/jakowenko/double-take/commit/0842d987de25c2a5495cafe73967d30bc96bbe8b))

## [1.11.0](https://github.com/jakowenko/double-take/compare/v1.10.1...v1.11.0) (2022-05-30)


### Features

* **ha addon:** ability to change STORAGE_PATH, CONFIG_PATH, SECRETS_PATH, MEDIA_PATH ([e5adba4](https://github.com/jakowenko/double-take/commit/e5adba4147e5e14fb6148d74270e2c55a8db99e4))


### Bug Fixes

* **ui:** update check logic ([b6e7ffc](https://github.com/jakowenko/double-take/commit/b6e7ffc86e9bf6d25307cb814a04a378dcd48998))

## [1.11.0-beta.2](https://github.com/jakowenko/double-take/compare/v1.11.0-beta.1...v1.11.0-beta.2) (2022-05-30)


### Bug Fixes

* **ui:** update check logic ([b6e7ffc](https://github.com/jakowenko/double-take/commit/b6e7ffc86e9bf6d25307cb814a04a378dcd48998))

## [1.11.0-beta.1](https://github.com/jakowenko/double-take/compare/v1.10.1...v1.11.0-beta.1) (2022-05-30)


### Features

* **ha addon:** ability to change STORAGE_PATH, CONFIG_PATH, SECRETS_PATH, MEDIA_PATH ([e5adba4](https://github.com/jakowenko/double-take/commit/e5adba4147e5e14fb6148d74270e2c55a8db99e4))

### [1.10.1](https://github.com/jakowenko/double-take/compare/v1.10.0...v1.10.1) (2022-05-25)


### Bug Fixes

* **api:** catch heartbeat error ([f085dad](https://github.com/jakowenko/double-take/commit/f085dad9be4293e382875e06bb345d3c404cdff3))

### [1.10.1-beta.1](https://github.com/jakowenko/double-take/compare/v1.10.0...v1.10.1-beta.1) (2022-05-25)


### Bug Fixes

* **api:** catch heartbeat error ([f085dad](https://github.com/jakowenko/double-take/commit/f085dad9be4293e382875e06bb345d3c404cdff3))

## [1.10.0](https://github.com/jakowenko/double-take/compare/v1.9.0...v1.10.0) (2022-05-24)


### Features

* **config:** anonymous telemetry data used to help deliver new features ([3e35091](https://github.com/jakowenko/double-take/commit/3e3509115b9f250aee62387a6fc34e255e18be22))


### Bug Fixes

* delete tmp masked images ([#208](https://github.com/jakowenko/double-take/issues/208)) ([c6b40c5](https://github.com/jakowenko/double-take/commit/c6b40c5293b5805477ea6125e4d1496953c06559))

## [1.10.0-beta.1](https://github.com/jakowenko/double-take/compare/v1.9.1-beta.1...v1.10.0-beta.1) (2022-05-24)


### Features

* **config:** anonymous telemetry data used to help deliver new features ([3e35091](https://github.com/jakowenko/double-take/commit/3e3509115b9f250aee62387a6fc34e255e18be22))

### [1.9.1-beta.1](https://github.com/jakowenko/double-take/compare/v1.9.0...v1.9.1-beta.1) (2022-05-23)


### Bug Fixes

* delete tmp masked images ([#208](https://github.com/jakowenko/double-take/issues/208)) ([c6b40c5](https://github.com/jakowenko/double-take/commit/c6b40c5293b5805477ea6125e4d1496953c06559))

## [1.9.0](https://github.com/jakowenko/double-take/compare/v1.8.0...v1.9.0) (2022-05-23)


### Features

* **api:** update frigate sub label ([ad40018](https://github.com/jakowenko/double-take/commit/ad40018ddc1319ccf6b3e0d2d98784d35931826d))


### Bug Fixes

* det_prob_threshold in compreface detector test ([#185](https://github.com/jakowenko/double-take/issues/185)) ([439179a](https://github.com/jakowenko/double-take/commit/439179acd0e2c8f2c458de7604ff1eb817d08df2))


### Build

* copy .eslintrc.js during build process ([a89db5c](https://github.com/jakowenko/double-take/commit/a89db5c3f9b4c1f2cfb147c78b50d83d1acae3f1))
* **deps:** package updates ([f2936f6](https://github.com/jakowenko/double-take/commit/f2936f6beaac37fc5c788207c4e88fb3e98a7a06))
* semantic versioning for beta builds ([cc617c9](https://github.com/jakowenko/double-take/commit/cc617c98fb4e1c25bdfec6667353dd1b10a953f1))

## [1.9.0-beta.2](https://github.com/jakowenko/double-take/compare/v1.9.0-beta.1...v1.9.0-beta.2) (2022-05-23)


### Bug Fixes

* det_prob_threshold in compreface detector test ([#185](https://github.com/jakowenko/double-take/issues/185)) ([439179a](https://github.com/jakowenko/double-take/commit/439179acd0e2c8f2c458de7604ff1eb817d08df2))

## [1.9.0-beta.1](https://github.com/jakowenko/double-take/compare/v1.8.0...v1.9.0-beta.1) (2022-05-23)


### Features

* **api:** update frigate sub label ([ad40018](https://github.com/jakowenko/double-take/commit/ad40018ddc1319ccf6b3e0d2d98784d35931826d))


### Build

* copy .eslintrc.js during build process ([a89db5c](https://github.com/jakowenko/double-take/commit/a89db5c3f9b4c1f2cfb147c78b50d83d1acae3f1))
* **deps:** package updates ([f2936f6](https://github.com/jakowenko/double-take/commit/f2936f6beaac37fc5c788207c4e88fb3e98a7a06))
* semantic versioning for beta builds ([cc617c9](https://github.com/jakowenko/double-take/commit/cc617c98fb4e1c25bdfec6667353dd1b10a953f1))

## [1.8.0](https://github.com/jakowenko/double-take/compare/v1.7.0...v1.8.0) (2022-05-20)


### Features

* **api:** zip export of storage directory ([ccae0f9](https://github.com/jakowenko/double-take/commit/ccae0f987e39e7cad0a14fb0562a3bc4c84902fc))


### Build

* **deps:** update packages ([dc2b5e4](https://github.com/jakowenko/double-take/commit/dc2b5e48e5c9c52b1df6045fbef7090b9c627b7c))

# [1.7.0](https://github.com/jakowenko/double-take/compare/v1.6.0...v1.7.0) (2021-11-27)


### Bug Fixes

* better support of jpg images for thumbnails/box ([#156](https://github.com/jakowenko/double-take/issues/156)) ([04e7d83](https://github.com/jakowenko/double-take/commit/04e7d83b6317ac26cb58fb0636544f370adbf257))
* lowercase camera name in mqtt topics ([#163](https://github.com/jakowenko/double-take/issues/163)) ([57e605b](https://github.com/jakowenko/double-take/commit/57e605bc911c96f169c3f524476b60e67710303d))
* optional chaining for frigate url ([68a9032](https://github.com/jakowenko/double-take/commit/68a9032562e77f441e2986e2e931d912b969f4c2))
* use lower compreface det_prob_threshold for /recognize/test ([#136](https://github.com/jakowenko/double-take/issues/136)) ([6a0c435](https://github.com/jakowenko/double-take/commit/6a0c43535e1871edfa8478fa64124a016550283f))


### Features

* ability to change mqtt client_id ([#168](https://github.com/jakowenko/double-take/issues/168)) ([98d7f2a](https://github.com/jakowenko/double-take/commit/98d7f2a89f8a242685fc205d8e5afec7e53e995d))
* **api:** validate config with jsonschema ([ad23c7b](https://github.com/jakowenko/double-take/commit/ad23c7b30af61fdc9157f050de753438792d9028))
* edit secrets.yml from ui ([963cacd](https://github.com/jakowenko/double-take/commit/963cacdf2074f6ccb56bbc9b3ffb0f3db38a53f4))
* secrets.yml support ([#170](https://github.com/jakowenko/double-take/issues/170)) ([53b11c8](https://github.com/jakowenko/double-take/commit/53b11c816a769d6085e629ca3f7c0c4f9c975ea3))
* support ui base path ([#166](https://github.com/jakowenko/double-take/issues/166)) ([b1d06aa](https://github.com/jakowenko/double-take/commit/b1d06aafb424bb05f5d0f3271910a6a2059b2cb8))

# [1.6.0](https://github.com/jakowenko/double-take/compare/v1.5.2...v1.6.0) (2021-10-29)


### Features

* hass.io add-on support ([724c076](https://github.com/jakowenko/double-take/commit/724c0765a106147126edde002ea35defeb335d7d))
* **ui:** config service tooltips ([324b9cb](https://github.com/jakowenko/double-take/commit/324b9cbf44f75942db78fc3f38cd3be83a0b93aa))

## [1.5.2](https://github.com/jakowenko/double-take/compare/v1.5.1...v1.5.2) (2021-10-21)


### Bug Fixes

* **api:** delete tmp file after processing ([#76](https://github.com/jakowenko/double-take/issues/76)) ([189216b](https://github.com/jakowenko/double-take/commit/189216bfe001eae568974d427636d913026db330))

## [1.5.1](https://github.com/jakowenko/double-take/compare/v1.5.0...v1.5.1) (2021-10-19)


### Bug Fixes

* **api:** verify www-authenticate header exists ([cd78efe](https://github.com/jakowenko/double-take/commit/cd78efe6671d3a7f1acebc85ac1f57bb36b3f2ad))

# [1.5.0](https://github.com/jakowenko/double-take/compare/v1.4.1...v1.5.0) (2021-10-16)


### Bug Fixes

* **api:** validate content type to allow for extra strings from Hikvision cameras ([#127](https://github.com/jakowenko/double-take/issues/127)) ([db7d58f](https://github.com/jakowenko/double-take/commit/db7d58f1616d437d97a7433e7aa7eaa33e44d5d8))
* **ui:** update pagination and dropdown totals when deleting matches ([77e63f4](https://github.com/jakowenko/double-take/commit/77e63f420b2134091c03217775638deeb4ccad9e))


### Features

* frigate snapshot attempts default from 0 to 10 ([423d204](https://github.com/jakowenko/double-take/commit/423d204bc3608adf1dee4bef7f62002b26a2d67f))
* support digest auth ([#128](https://github.com/jakowenko/double-take/issues/128)) ([eebb792](https://github.com/jakowenko/double-take/commit/eebb7923f50fbdd99cb38daae963d14a71bb5170))

## [1.4.1](https://github.com/jakowenko/double-take/compare/v1.4.0...v1.4.1) (2021-10-13)


### Bug Fixes

* account for misses in camera person count ([561ec5c](https://github.com/jakowenko/double-take/commit/561ec5c2998af1502eec82a31c751394f7b9a1e8))
* **api:** publish camera mqtt topic for misses ([#125](https://github.com/jakowenko/double-take/issues/125)) ([cb3fb22](https://github.com/jakowenko/double-take/commit/cb3fb228412161e53991182e119be56582aca7b3))
* **api:** save latest images for misses ([62f586c](https://github.com/jakowenko/double-take/commit/62f586c761baa45b794ed405df27bbd767b72d0b))
* **ui:** don't show update icon if last run was from CodeQL ([8d258ea](https://github.com/jakowenko/double-take/commit/8d258ea7371334ce0648bb4e16b0ebb74c5225d2))

# [1.4.0](https://github.com/jakowenko/double-take/compare/v1.3.0...v1.4.0) (2021-10-12)


### Bug Fixes

* **api:train:** validate mime type and result of database.get.fileByFilename ([#123](https://github.com/jakowenko/double-take/issues/123)) ([d5e050f](https://github.com/jakowenko/double-take/commit/d5e050fa708b500f97f2babde5b7256d08bea426))
* **api:** catch facebox error before normalizing data ([67c93c4](https://github.com/jakowenko/double-take/commit/67c93c4ce10d35efb6f678841c867dc0cc7a71cc))
* **api:** delete orphaned db records when deleting training folder / files ([f031545](https://github.com/jakowenko/double-take/commit/f031545b15b6193e6e4c15a73222f2593c26e265))
* **ui:** fix multiselect dropdowns when open and scrolling ([ae2085b](https://github.com/jakowenko/double-take/commit/ae2085bf8d9b04bdaead3bf40c10f63cc9eaea7b))
* **ui:** theme wouldn't load if setting to same theme ([88b0976](https://github.com/jakowenko/double-take/commit/88b097621c0d6bce9c90059d470723dfcbe5ace1))


### Features

* **api:** api/latest/<name>.jpg ([#120](https://github.com/jakowenko/double-take/issues/120)) ([cd765ae](https://github.com/jakowenko/double-take/commit/cd765ae39067221687a1ba3c72b7f2c92e8d5c46))
* **api:** use camera name when using custom mqtt topic ([70a4ce3](https://github.com/jakowenko/double-take/commit/70a4ce3d0b6d22eb0619b31a65616b84beba7f98))
* **ui:** enable/disable sockets on matches page ([bb95e0a](https://github.com/jakowenko/double-take/commit/bb95e0a0ff20c9e11f3a28b2405ccdf2d35b763a))

# [1.3.0](https://github.com/jakowenko/double-take/compare/v1.2.0...v1.3.0) (2021-10-06)


### Features

* schedule to disable recognition ([#115](https://github.com/jakowenko/double-take/issues/115)) ([84235d3](https://github.com/jakowenko/double-take/commit/84235d38c243a33bd67946f764d698acf81e530f))
* **ui:config:** double take status is determined by sockets ([65d094f](https://github.com/jakowenko/double-take/commit/65d094fe8376db828bba802eca7f35206ec8cba7))
* **ui:config:** frigate version and last event in tooltip ([cddbebc](https://github.com/jakowenko/double-take/commit/cddbebc9b81ebf1d262e433340ab93aed4254852))
* **ui:config:** pull to refresh ([57af9d5](https://github.com/jakowenko/double-take/commit/57af9d5b8dfae9b300976c7005ec719e19665c0f))
* **ui:menu:** speed dial action buttons ([8282320](https://github.com/jakowenko/double-take/commit/82823207960bf0e0a3831c60ff46c9a045859219))
* **ui:status:** frigate last camera in tooltip ([ac9c7a8](https://github.com/jakowenko/double-take/commit/ac9c7a8d8d27b2e30fa32da1c8665dc291d1ef8d))
* **ui:** format tooltips times ([aee36d8](https://github.com/jakowenko/double-take/commit/aee36d8b8d1d32a282ee85cc6c1bf0832be8ed9e))
* **ui:** pull to refresh on matches and training pages ([80aa5a8](https://github.com/jakowenko/double-take/commit/80aa5a87942cc5045e2fe68b5472efac10eec053))

# [1.2.0](https://github.com/jakowenko/double-take/compare/v1.1.0...v1.2.0) (2021-09-30)


### Bug Fixes

* **ui:** remove frigate status icon if removed after displayed ([f01c735](https://github.com/jakowenko/double-take/commit/f01c7355c692a67ea653439e169bd3b50f01cc66))


### Features

* custom webkit scrollbars to match theme ([b6620af](https://github.com/jakowenko/double-take/commit/b6620afe570fc79e4d3f6968eb4c2b9217027840))
* **ui:** change ui and editor theme via config ([5d6d123](https://github.com/jakowenko/double-take/commit/5d6d123665f0227810e610f89afe3800d79b64f7))
* **ui:** log page for viewing / clearing log file ([#113](https://github.com/jakowenko/double-take/issues/113)) ([2ab8d14](https://github.com/jakowenko/double-take/commit/2ab8d146461a2703f880be01367e4bdef0c15b13))
* **ui:** mqtt status on config page ([7b3b425](https://github.com/jakowenko/double-take/commit/7b3b42597ed52fb4f86924cc56142f4eedc9f3dd))

# [1.1.0](https://github.com/jakowenko/double-take/compare/v1.0.0...v1.1.0) (2021-09-25)


### Bug Fixes

* call for new matches on paginated page after loading is set to false ([231ac12](https://github.com/jakowenko/double-take/commit/231ac128f964028a4403395e373b210012e0a607))
* don't reset filters when all results on page are deleted ([#106](https://github.com/jakowenko/double-take/issues/106)) ([bf5ebac](https://github.com/jakowenko/double-take/commit/bf5ebacd05ff66113886056ec58f34c9a30f4d1f))
* pass camera name when reprocessing image ([cbe7a57](https://github.com/jakowenko/double-take/commit/cbe7a57907b2bc3148b7d523b03b240d3daa224a))
* replace image-size with probe-image-size ([5b7816a](https://github.com/jakowenko/double-take/commit/5b7816a78cba2e4502266140506157215ec6b289))


### Features

* ability to override frigate options per camera ([#110](https://github.com/jakowenko/double-take/issues/110)) ([e2f93e6](https://github.com/jakowenko/double-take/commit/e2f93e63d0f7031b92690e612f9b57d28ebe4adc))
* **ui:** camera and event type filters ([#106](https://github.com/jakowenko/double-take/issues/106)) ([c914308](https://github.com/jakowenko/double-take/commit/c91430843587291974627138b8370bdb9db61632))

# [1.0.0](https://github.com/jakowenko/double-take/compare/v0.10.2...v1.0.0) (2021-09-21)


### Bug Fixes

* add auth middleware to filters route ([d25c1fd](https://github.com/jakowenko/double-take/commit/d25c1fd5baa53cee28990f3b1e999aa73bd08914))
* add auth token to saveURLs function ([#70](https://github.com/jakowenko/double-take/issues/70)) ([167758f](https://github.com/jakowenko/double-take/commit/167758f1c2a0d9ad71fb47bd02e16235716434cf))
* add support for multiple training uploads ([#77](https://github.com/jakowenko/double-take/issues/77)) ([142b3f7](https://github.com/jakowenko/double-take/commit/142b3f7ec39a11e63327dc50a2081407ab023e6f))
* better error handling when training fails to prevent stuck loading bar ([07dfd25](https://github.com/jakowenko/double-take/commit/07dfd250fdc357574dc45eca51e2ce2060a5c69f))
* better handling of new filters ([3fffa6e](https://github.com/jakowenko/double-take/commit/3fffa6e04b41fa14b3c2eba6bbea08cb5c5701ab))
* button alignment on train toolbar ([c9b38ce](https://github.com/jakowenko/double-take/commit/c9b38ce9134abeb87e2c74edace8660423d4e180))
* catch errors from recognize/test ([51629d3](https://github.com/jakowenko/double-take/commit/51629d3f970c4458cc472f5738701dc4ccc8c062))
* catch get-orientation errors ([d1ca17d](https://github.com/jakowenko/double-take/commit/d1ca17d1215a204f4d765476d42a43868accb5ad))
* catch if paginated page has no results and return to page 1 ([713be92](https://github.com/jakowenko/double-take/commit/713be926a3fa4c1aa686f2afc64a45809ac4f0e2))
* catch invalid config on save before writing file ([#94](https://github.com/jakowenko/double-take/issues/94)) ([e4503e8](https://github.com/jakowenko/double-take/commit/e4503e86082e5c182a40801cf542c59abcfa586c))
* catch when time format is null ([#98](https://github.com/jakowenko/double-take/issues/98)) ([ed872dd](https://github.com/jakowenko/double-take/commit/ed872dd4dbc7f85c6a6c2232bf5bf5d7362997c3))
* check for first number in status to determine if file is trained or untrained ([125f96e](https://github.com/jakowenko/double-take/commit/125f96e2d7eba324a98b14000367ec310b631459))
* clean /tmp files after processing and remove all on restarts [#76](https://github.com/jakowenko/double-take/issues/76) ([a5c761f](https://github.com/jakowenko/double-take/commit/a5c761fc01f4d524a45b139d4539d6d85eb4d505))
* clean mqtt /tmp files after processing [#76](https://github.com/jakowenko/double-take/issues/76) ([b6478ce](https://github.com/jakowenko/double-take/commit/b6478ce9e3c50ba9302e1179c2a7951fae51c8be))
* clear disabled array ([dd84f85](https://github.com/jakowenko/double-take/commit/dd84f85ebbdd62f1beeec7252e313ee9f99390ee))
* define default value for error ([5f27099](https://github.com/jakowenko/double-take/commit/5f27099360c6616fb69385ad0081d4962906c07d))
* don't reprocess if no detectors configured ([157e7c7](https://github.com/jakowenko/double-take/commit/157e7c78f9428564278916833da919d95958dccc))
* loop through compreface plugin results on ui ([83cea24](https://github.com/jakowenko/double-take/commit/83cea249f250ae2a4d3512d9360e5de157cb55ed))
* **mqtt:** don't publish message if client isn't connected ([5901ebe](https://github.com/jakowenko/double-take/commit/5901ebef1bbe9992c08ee315e9c9fceb496db662))
* pass auth token on /cameras route to recognize endpoint ([2e940bf](https://github.com/jakowenko/double-take/commit/2e940bf39958e8498064185d1b2a9218ea283146))
* pass upcoming filename to start function to use in response ([32f0bae](https://github.com/jakowenko/double-take/commit/32f0bae40ffd1c4e48d9bc31117cb7f618c549fc))
* prevent pagination changes if api is loading ([c767aae](https://github.com/jakowenko/double-take/commit/c767aaed927e70e993ec42fdeaa1e81fb2dbabbb))
* sanpshot mask check ([56f3ea6](https://github.com/jakowenko/double-take/commit/56f3ea6c40cbe1f2312fd2d5a32ee13ff245dedd))
* update respond middleware to use res.customStatusCode instead of native res.statusCode ([caf6a89](https://github.com/jakowenko/double-take/commit/caf6a891d682f8d8afcc7ede9a1158b93aee21a9))
* use HTTPSuccess for test controller response ([9bcf8fa](https://github.com/jakowenko/double-take/commit/9bcf8faa65ea4f0c1b5451c08bfeba6d30e836e6))


### chore

* release ([824db79](https://github.com/jakowenko/double-take/commit/824db79af1f007e4188e16d4d6723af746ea25b3))


### Features

* ability to adjust thumbnail quality/size and page limit ([e5207fa](https://github.com/jakowenko/double-take/commit/e5207fa8b39affa4a72e6213a0817b17781ff5ae))
* ability to include base64 encoded string in API results and MQTT messages ([#52](https://github.com/jakowenko/double-take/issues/52)) ([233d56a](https://github.com/jakowenko/double-take/commit/233d56a36e09b6c408131ce64461e449021b8811))
* ability to increase auth token expiration ([#78](https://github.com/jakowenko/double-take/issues/78), [#80](https://github.com/jakowenko/double-take/issues/80)) ([d68d39e](https://github.com/jakowenko/double-take/commit/d68d39ef0faf5d20edfbf9099bc0108e7e4dd6fd))
* ability to mask images before processing [#79](https://github.com/jakowenko/double-take/issues/79) ([decb245](https://github.com/jakowenko/double-take/commit/decb245a5e1efd61af58e02354885e7952bf761f))
* ability to reprocess images from the matches page ([#84](https://github.com/jakowenko/double-take/issues/84)) ([809d5f3](https://github.com/jakowenko/double-take/commit/809d5f3f3b6e41825a685deec8deb613306fc277))
* ability to resize source images with query string ([c2ea600](https://github.com/jakowenko/double-take/commit/c2ea60055ccad0df7fe3b191a369146551f20812))
* add a delay expressed in seconds between each detection loop ([#83](https://github.com/jakowenko/double-take/issues/83)) ([23dc29e](https://github.com/jakowenko/double-take/commit/23dc29e4c9e4cb6a382650ac563006326995773a))
* add createdAt, updatedAt to detector detail and tooltip ([#100](https://github.com/jakowenko/double-take/issues/100)) ([03c83f5](https://github.com/jakowenko/double-take/commit/03c83f5a24dc48632ede070bbba0a4905d703299))
* allow customizing frigate labels ([#95](https://github.com/jakowenko/double-take/issues/95)) ([5eb100a](https://github.com/jakowenko/double-take/commit/5eb100a0653e0fbe07efe827c0b0f6a9c07efd5a))
* apple-touch-startup-image and theme color ([d8106bb](https://github.com/jakowenko/double-take/commit/d8106bbf61169a0da9f5d14e239e697619117beb))
* configure detector timeouts ([f654dec](https://github.com/jakowenko/double-take/commit/f654dec6cdf9819bfdbc337261af4cf8e11a9d8e))
* copy yaml config with defaults ([052ab4b](https://github.com/jakowenko/double-take/commit/052ab4b63553f70ae2457f2ead3a42c45bcdaf6a))
* enable or disable frigate mqtt topic snapshot processing ([#83](https://github.com/jakowenko/double-take/issues/83)) ([3bf2bea](https://github.com/jakowenko/double-take/commit/3bf2beac78d139a746d4dd6308e54aff65e5c155))
* filter training results when dropdown is used ([#89](https://github.com/jakowenko/double-take/issues/89)) ([81232aa](https://github.com/jakowenko/double-take/commit/81232aa7d2c23cf0fe72084ef9ea976c8e534732))
* include reasons why image was a miss on matches page ([#90](https://github.com/jakowenko/double-take/issues/90)) ([f5e220b](https://github.com/jakowenko/double-take/commit/f5e220bd923b7e9621b7063aafacacf790dbb342))
* include version on config page with ability to copy ([029bfea](https://github.com/jakowenko/double-take/commit/029bfeaf9d44859a91e05eaef989c8c6dbd34fcf))
* log level support ([#84](https://github.com/jakowenko/double-take/issues/84)) ([5f91b83](https://github.com/jakowenko/double-take/commit/5f91b83d8df22d410dd6895c3d78f1c04e4793cd))
* pagination and filtering on all matches + refactoring ([af30071](https://github.com/jakowenko/double-take/commit/af300715852b8a9717c86e8bd30538607f1042ce))
* publish errors to mqtt topic ([#52](https://github.com/jakowenko/double-take/issues/52)) ([01a2d6c](https://github.com/jakowenko/double-take/commit/01a2d6cfa5fac13425dc555edc9b680a951537b9))
* redact secrets and keys from logs ([0f3ef02](https://github.com/jakowenko/double-take/commit/0f3ef0274deda4e2b15de0ac2137c0e131cb0d55))
* sockets for live reloading ([50fef76](https://github.com/jakowenko/double-take/commit/50fef76ac6cc8a43c22912d0725117f933d60e71))
* support for compreface mask plugin ([#85](https://github.com/jakowenko/double-take/issues/85)) ([7951524](https://github.com/jakowenko/double-take/commit/795152451943d0d55a1f778365a7fad23fe62934))
* support for multiple frigate urls and topics ([4ead9f7](https://github.com/jakowenko/double-take/commit/4ead9f7562e6ab82fe93909f47dbe50aa0aba624))
* **train:** pagination ([f749437](https://github.com/jakowenko/double-take/commit/f749437e8bb4c666472799c088939705dc416cab))


### BREAKING CHANGES

* v1.0.0
