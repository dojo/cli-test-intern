import { Command, Helper, OptionsHelper } from '@dojo/cli/interfaces';
import { underline } from 'chalk';
import * as path from 'path';
import runTests, { TestOptions } from './runTests';
import javaCheck from './javaCheck';

const pkgDir = require('pkg-dir');

const CLI_BUILD_PACKAGE = '@dojo/cli-build-webpack';

export interface TestArgs {
	all: boolean;
	browser: boolean;
	config?: string;
	coverage?: boolean;
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
}

function buildNpmDependencies(): any {
	try {
		const packagePath = pkgDir.sync(__dirname);
		const packageJsonFilePath = path.join(packagePath, 'package.json');
		const packageJson = <any> require(packageJsonFilePath);

		return packageJson.dependencies;
	}
	catch (e) {
		throw new Error('Failed reading dependencies from package.json - ' + e.message);
	}
}

function transformTestArgs(args: TestArgs): TestOptions {
	let nodeUnit = true;
	let remoteUnit = false;
	let remoteFunctional = false;

	if (args.all) {
		nodeUnit = remoteUnit = remoteFunctional = true;
	}

	if (args.unit) {
		remoteUnit = true;
	}

	if (args.functional) {
		nodeUnit = remoteUnit = false;
		remoteFunctional = true;
	}

	return {
		childConfig: args.config,
		internConfig: args.internConfig,
		reporters: args.reporters,
		userName: args.userName,
		secret: args.secret,
		testingKey: args.testingKey,
		verbose: args.verbose,
		coverage: args.coverage,
		filter: args.filter,
		nodeUnit,
		remoteUnit,
		remoteFunctional
	};
}

function printBrowserLink(args: TestArgs) {
	const browserArgs = [];

	if (args.filter) {
		browserArgs.push('grep=' + encodeURIComponent(args.filter));
	}

	console.log('\n If the project directory is hosted on a local server, unit tests can also be run in browser by navigating to ' + underline(`http://localhost:<port>/node_modules/intern/?config=node_modules/@dojo/cli-test-intern/intern/intern.json${browserArgs.length ? `&${browserArgs.join('&')}` : ''}`));
}

const command: Command<TestArgs> = {
	description: 'this command will implicitly build your application and then run tests against that build',
	register(options: OptionsHelper) {
		options('a', {
			alias: 'all',
			describe: 'Runs unit tests and functional tests. Unit tests are run via node and the local tunnel. Functional tests are run via the local tunnel',
			default: false
		});

		options('c', {
			alias: 'config',
			describe: `Specifies what configuration to test with: 'local'(default), 'browserstack', 'testingbot', or 'saucelabs'.`,
			type: 'string'
		});

		options('cov', {
			alias: 'coverage',
			describe: `If specified, additional coverage reports will be written.  The will be output to the path specified in argument '-o'/'--output'.`
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

		options('o', {
			alias: 'output',
			describe: `The path to output any test output to (e.g. coverage information). Defaults to './output/tests'`,
			type: 'string',
			default: './output/tests'
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
	},
	run(helper: Helper, args: TestArgs) {
		function unhandledRejection(reason: any) {
			console.log('Unhandled Promise Rejection: ');
			console.log(reason);
		}

		process.on('unhandledRejection', unhandledRejection);

		return javaCheck(args).then((javaCheckPassed) => {
			if (javaCheckPassed) {
				return new Promise<void>((resolve, reject) => {
					if (!helper.command.exists('build')) {
						reject(Error(`Required command: 'build', does not exist. Have you run 'npm install ${CLI_BUILD_PACKAGE}'?`));
					}
					try {
						const projectName = require(path.join(process.cwd(), './package.json')).name;
						console.log('\n' + underline(`building "${projectName}"...`));
					}
					catch (e) {
						console.log('\n' + underline(`building project...`));
					}
					const result = helper.command.run('build', '',
						<any> { withTests: true, disableLazyWidgetDetection: true });
					result.then(
						() => {
							runTests(transformTestArgs(args))
								.then(() => {
									process.removeListener('unhandledRejection', unhandledRejection);
								})
								.then(() => {
									printBrowserLink(args);
								}, (err) => {
									printBrowserLink(args);
									throw err;
								})
								.then(resolve, reject);
						},
						reject
					);
				});
			} else {
				return Promise.reject(Error(underline('Error! Java VM could not be found.') +
					'\nA Java VM needs to be installed and available from the command line to allow the ' +
					underline('dojo test') + ' command to run tests in a browser locally or remotely.'));
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
				path: __dirname + '/intern',
				files: [
					'./intern.json'
				]
			}
		};
	}
};
export default command;
