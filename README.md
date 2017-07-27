# cli-test-intern

[![Build Status](https://travis-ci.org/dojo/cli-test-intern.svg?branch=master)](https://travis-ci.org/dojo/cli-test-intern)
[![Build status](https://ci.appveyor.com/api/projects/status/nbgg2yf7hepsvvn2/branch/master?svg=true)](https://ci.appveyor.com/project/Dojo/cli-test-intern/branch/master)
[![codecov](https://codecov.io/gh/dojo/cli-test-intern/branch/master/graph/badge.svg)](https://codecov.io/gh/dojo/cli-test-intern)
[![npm version](https://badge.fury.io/js/%40dojo%2Fcli-test-intern.svg)](https://badge.fury.io/js/%40dojo%2Fcli-test-intern)

The official Dojo 2 test command.

**WARNING** This is _beta_ software. While we do not anticipate significant changes to the API at this stage, we may feel the need to do so. This is not yet production ready, so you should use at your own risk.

## Features

Builds and runs test cases for a Dojo 2 application. This module assumes that your project is structured
as it would be if created by `dojo create`. Specifically, `src` and `tests` should be in the root of the project directory,
and `tests` should have `functional` and `unit` folders with `all.ts` files in each that import other tests.

## How do I use this package?

To build and run tests locally, just execute `dojo test` in your project. There are several configuration options, to see what
options are available run `dojo test -h`

## How do I contribute?

We appreciate your interest!  Please see the [Dojo 2 Meta Repository](https://github.com/dojo/meta#readme) for the
Contributing Guidelines and Style Guide.

## Testing

Test cases MUST be written using [Intern](https://theintern.github.io) using the Object test interface and Assert assertion interface.

90% branch coverage MUST be provided for all code submitted to this repository, as reported by Istanbul’s combined coverage results for all supported platforms.

To test locally in node run:

`grunt test`

## Licensing information

* [ora](https://github.com/sindresorhus/ora) ([MIT](https://opensource.org/licenses/MIT))
* [Chalk](https://github.com/chalk/chalk)([MIT](https://opensource.org/licenses/MIT))
* [cross-spawn](https://github.com/IndigoUnited/node-cross-spawn)([MIT](https://opensource.org/licenses/MIT))
* [pkg-dir](https://github.com/sindresorhus/pkg-dir)([MIT](https://opensource.org/licenses/MIT))
* [Istanbul](https://github.com/gotwarlost/istanbul)([New BSD](http://opensource.org/licenses/BSD-3-Clause))
* [Mockery](https://github.com/mfncooper/mockery)([MIT](https://opensource.org/licenses/MIT))
* [codecov.io](https://github.com/cainus/codecov.io)([MIT](https://opensource.org/licenses/MIT))
* [Glob](https://github.com/isaacs/node-glob)([ISC](https://opensource.org/licenses/ISC))
* [grunt-tslint](https://github.com/palantir/grunt-tslint)([Apache 2.0](https://opensource.org/licenses/Apache-2.0))
* [Sinon.JS](https://github.com/sinonjs/sinon)([New BSD](http://opensource.org/licenses/BSD-3-Clause))
* [TSLint](https://github.com/palantir/tslint)([Apache 2.0](https://opensource.org/licenses/Apache-2.0))
* [yargs](https://github.com/yargs/yargs)([MIT](https://opensource.org/licenses/MIT))

© 2004–2017 JS Foundation & contributors. [New BSD](LICENSE) license.

