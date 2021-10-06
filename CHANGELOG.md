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
