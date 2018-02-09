# cli-test-intern

[![Build Status](https://travis-ci.org/dojo/cli-test-intern.svg?branch=master)](https://travis-ci.org/dojo/cli-test-intern)
[![Build status](https://ci.appveyor.com/api/projects/status/nbgg2yf7hepsvvn2/branch/master?svg=true)](https://ci.appveyor.com/project/Dojo/cli-test-intern/branch/master)
[![codecov](https://codecov.io/gh/dojo/cli-test-intern/branch/master/graph/badge.svg)](https://codecov.io/gh/dojo/cli-test-intern)
[![npm version](https://badge.fury.io/js/%40dojo%2Fcli-test-intern.svg)](https://badge.fury.io/js/%40dojo%2Fcli-test-intern)

The official Dojo 2 test command. This package uses Intern to run unit and functional tests against your Dojo project.

## Usage

### Prerequisites

This project is a command for the [Dojo CLI]. Please visit the Dojo CLI project for
 information about the project and how to install.

### Installation

The use `@dojo/cli-test-intern` in a project, install the package:

```bash
npm install @dojo/cli-test-intern
```

### Basic Usage

First, build your application and tests using [@dojo/cli-build-app]

```bash
dojo build app --mode dev
dojo build app --mode test
```

Then, run your tests using @dojo/cli-test-intern

```bash
dojo test -a
```

There are several configuration options available. To list them run `dojo test -h`.

## Running Tests

Intern supports two types of testing approaches unit and functional. Unit tests are tests run via node and the local
[Selenium] tunnel and test isolated blocks of code. Functional tests are run using Selenium in the browser and test
the overall functionality of the software as a user would interact with it.

### Unit tests

Unit tests may be run explicitly with the `-u` flag or as part of a full test run using the `-a` flag

```bash
dojo test -u
```

`@dojo/cli-test-intern` will execute tests located at `output/tests/unit.js` in node and in Chrome and provide a report 
listing any failed tests and display a coverage report.

### Functional tests

Functional tests may be run explicitly with the `-f` flag or as part of a full test run using the `-a` flag

```bash
dojo test -f
```

`@dojo/cli-test-intern` will execute tests located at `./output/test/functional.js` in Chrome using Selenium and provide a
 report listing any failed tests.

### Testing services

Intern comes with support for running tests remotely on [BrowserStack], [SauceLabs], and [TestingBot]. You may use one
 of these services by signing up for an account and providing your credentials to cli-test-intern. By default, all of
 the testing services will run tests against IE11, Firefox, and Chrome.
 
#### BrowserStack

[BrowserStack] requires an access key and username to use its services. These may be provided on the command line or as 
environment variables as described in [Intern's documentation](https://theintern.io/docs.html#Intern/4/docs/docs%2Frunning.md/cloud-service).

```bash
dojo test -a -c browserstack -k <accesskey> --userName <username>
```

or with environment variables

```bash
BROWSERSTACK_USERNAME=<username> BROWSERSTACK_ACCESS_KEY=<key> dojo test -a -c browserstack
```

#### SauceLabs

[SauceLabs] requires an access key and username to use its services. These may be provided on the command line or as 
environment variables as described in [Intern's documentation](https://theintern.io/docs.html#Intern/4/docs/docs%2Frunning.md/cloud-service).

```bash
dojo test -a -c saucelabs -k <accesskey> --userName <username>
```

or with environment variables

```bash
SAUCE_USERNAME=<username> SAUCE_ACCESS_KEY=<key> dojo test -a -c saucelabs
```

#### TestingBot

[TestingBot] requires an key and a secret to use its services. These may be provided on the command line or as 
environment variables as described in [Intern's documentation](https://theintern.io/docs.html#Intern/4/docs/docs%2Frunning.md/cloud-service).

```bash
dojo test -a -c testingbot -k <key> -s <secret>
```

or with environment variables

```bash
TESTINGBOT_SECRET=<secret> TESTINGBOT_KEY=<key> dojo test -a -c saucelabs
```

## How do I contribute?

We appreciate your interest!  Please see the [Dojo 2 Meta Repository](https://github.com/dojo/meta#readme) for the
Contributing Guidelines.

### Code Style

This repository uses [`prettier`](https://prettier.io/) for code styling rules and formatting. A pre-commit hook is installed automatically and configured to run `prettier` against all staged files as per the configuration in the projects `package.json`.

An additional npm script to run `prettier` (with write set to `true`) against all `src` and `test` project files is available by running:

```bash
npm run prettier
```

## Testing

Test cases MUST be written using [Intern] using the "bdd" test interface and "assert" assertion interface.

90% branch coverage MUST be provided for all code submitted to this repository, as reported by Istanbul’s combined coverage results for all supported platforms.

To test locally in node run:

`grunt test`

© 2018 [JS Foundation] & contributors. [New BSD](LICENSE) license.

[@dojo/cli-build-app]: https://github.com/dojo/cli-build-app
[BrowserStack]: https://www.browserstack.com/
[Dojo CLI]: https://github.com/dojo/cli
[Intern]: https://theintern.io/
[JS Foundation]: https://js.foundation/
[SauceLabs]: https://saucelabs.com/
[Selenium]: http://www.seleniumhq.org/
[TestingBot]: https://testingbot.com/
