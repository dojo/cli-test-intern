import { Command, Helper, OptionsHelper } from '@dojo/cli/interfaces';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import runTests, { TestOptions } from './runTests';
import javaCheck from './javaCheck';

const pkgDir = require('pkg-dir');

export interface TestArgs {
	all: boolean;
	browser: boolean;
	config?: string;
	functional: boolean;
	reporters?: string;
	testingKey?: string;
	secret?: string;
	userName?: string;
	unit: boolean;
	verbose: boolean;
	internConfig: string;
	node: boolean;
	filter: string;
	legacyDojo: boolean;
}

function buildNpmDependencies(): any {
	try {
		const packagePath = pkgDir.sync(__dirname);
		const packageJsonFilePath = path.join(packagePath, 'package.json');
		const packageJson = <any>require(packageJsonFilePath);

		return packageJson.dependencies;
	} catch (e) {
		throw new Error('Failed reading dependencies from package.json - ' + e.message);
	}
}

/**
 * Compiled unit tests should exist when testing against a built application
 */
export function assertCompiledUnitTests(verbose: boolean) {
	const projectRoot = pkgDir.sync(process.cwd());
	const unitsPath = path.join(projectRoot, 'output', 'test', 'unit.js');
	const hasUnits = fs.existsSync(unitsPath);

	if (!hasUnits) {
		throw new Error(
			`Could not find tests${
				verbose ? ` in ${unitsPath}.\nH` : ', h'
			}ave you built the tests using dojo build?\n\nFor @dojo/cli-build-app run: dojo build app --mode test`
		);
	}
}

function transformTestArgs(args: TestArgs): TestOptions {
	let nodeUnit = true;
	let remoteUnit = false;
	let remoteFunctional = false;
	let childConfig;

	const internConfig = 'intern.json';

	if (args.config || args.node === false) {
		assertCompiledUnitTests(args.verbose);
		childConfig = args.config || 'local';
	}

	if (args.legacyDojo) {
		childConfig = 'legacydojo';
		if (args.config === 'local') {
			childConfig = 'legacydojolocal';
			remoteUnit = true;
		}
	}

	if (args.all) {
		nodeUnit = remoteUnit = remoteFunctional = true;
	}

	if (args.unit) {
		remoteUnit = true;
	}

	if (args.node === false) {
		remoteUnit = true;
		nodeUnit = false;
	}

	if (args.functional) {
		nodeUnit = remoteUnit = false;
		remoteFunctional = true;
	}

	return {
		internConfig,
		childConfig,
		reporters: args.reporters,
		userName: args.userName,
		secret: args.secret,
		testingKey: args.testingKey,
		verbose: args.verbose,
		filter: args.filter,
		nodeUnit,
		remoteUnit,
		remoteFunctional
	};
}

function printBrowserLink(options: TestOptions) {
	const browserArgs = [];

	if (options.filter) {
		browserArgs.push('grep=' + encodeURIComponent(options.filter));
	}

	console.log(
		'\n If the project directory is hosted on a local server, unit tests can also be run in browser by navigating to ' +
			chalk.underline(
				`http://localhost/node_modules/intern/?config=node_modules/@dojo/cli-test-intern/intern/intern.json${
					options.childConfig ? `@${options.childConfig}` : ''
				}${browserArgs.length ? `&${browserArgs.join('&')}` : ''}`
			)
	);
}

function printGoodbye(options: TestOptions) {
	if (options.childConfig) {
		printBrowserLink(options);
	} else {
		printLocalTest();
	}
}

function printLocalTest() {
	console.log(
		'\n These tests were run using Dojo JIT compilation. The test suite may also be run against the built application with ' +
			chalk.underline('dojo test -c local')
	);
}

const command: Command<TestArgs> = {
	description: 'run unit and/or functional tests for your application',
	register(options: OptionsHelper) {
		options('a', {
			alias: 'all',
			describe:
				'Runs unit tests and functional tests. Unit tests are run via node and the local tunnel. Functional tests are run via the local tunnel',
			default: false
		});

		options('c', {
			alias: 'config',
			describe: `Specifies what configuration to test with: 'local'(default), 'browserstack', 'testingbot', or 'saucelabs'.`,
			type: 'string'
		});

		options('f', {
			alias: 'functional',
			describe: 'Runs only functional tests. Tests are run via the local tunnel',
			default: false
		});

		options('k', {
			alias: 'testingKey',
			describe: 'API key for testingbot or accesskey for saucelabs or browserstack',
			type: 'string'
		});

		options('usr', {
			alias: 'userName',
			describe: 'User name for testing platform',
			type: 'string'
		});

		options('r', {
			alias: 'reporters',
			describe: 'Comma separated list of reporters to use, defaults to Console',
			type: 'string'
		});

		options('s', {
			alias: 'secret',
			describe: 'API secret for testingbot',
			type: 'string'
		});

		options('u', {
			alias: 'unit',
			describe: 'Runs unit tests via node and the local tunnel',
			default: false
		});

		options('v', {
			alias: 'verbose',
			describe: 'Produce diagnostic messages to the console.',
			default: false
		});

		options('n', {
			alias: 'node',
			describe: 'Run unit tests via node',
			type: 'boolean',
			default: true
		});

		options('filter', {
			describe: 'Run only tests whose IDs match a regular expression',
			type: 'string'
		});

		options('l', {
			alias: 'legacyDojo',
			describe: 'Use the Dojo 1 loader when running tests in node',
			type: 'boolean',
			default: false
		});
	},
	run(helper: Helper, args: TestArgs) {
		function unhandledRejection(reason: any) {
			console.log('Unhandled Promise Rejection: ');
			console.log(reason);
		}

		process.on('unhandledRejection', unhandledRejection);

		return javaCheck(args).then((javaCheckPassed) => {
			if (javaCheckPassed) {
				const testOptions = transformTestArgs(args);
				return new Promise<void>((resolve, reject) => {
					runTests(testOptions)
						.then(() => {
							process.removeListener('unhandledRejection', unhandledRejection);
						})
						.then(
							() => {
								printGoodbye(testOptions);
							},
							(err) => {
								printGoodbye(testOptions);
								throw err;
							}
						)
						.then(resolve, reject);
				});
			} else {
				return Promise.reject(
					Error(
						chalk.underline('Error! Java VM could not be found.') +
							'\nA Java VM needs to be installed and available from the command line to allow the ' +
							chalk.underline('dojo test') +
							' command to run tests in a browser locally or remotely.'
					)
				);
			}
		});
	},
	eject() {
		return {
			npm: {
				devDependencies: {
					...buildNpmDependencies()
				}
			},
			copy: {
				path: path.join(__dirname, 'intern'),
				files: ['intern.json']
			}
		};
	}
};
export default command;
