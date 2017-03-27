import { Command, Helper, OptionsHelper } from '@dojo/cli/interfaces';
import { blue } from 'chalk';
import * as path from 'path';
import { Argv } from 'yargs';
import runTests from './runTests';
const pkgDir = require('pkg-dir');
const projectName = require(path.join(process.cwd(), './package.json')).name;

export interface TestArgs extends Argv {
	all: boolean;
	browser?: boolean;
	config?: string;
	coverage?: boolean;
	debug: boolean;
	functional: boolean;
	internConfig?: string;
	output: string;
	reporters?: string;
	testingKey?: string;
	secret?: string;
	userName?: string;
	unit: boolean;
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

const command: Command = {
	description: 'this command will implicitly build your application and then run tests against that build',
	register(options: OptionsHelper) {
		options('a', {
			alias: 'all',
			describe: 'Indicates that all tests (both unit and functional) should be run. By default, only unit tests are run.',
			default: false
		});

		options('b', {
			alias: 'browser',
			describe: 'Indicates that unit tests should be run in the browser (default node). Note that functional tests are always run in the browser.',
			type: 'boolean'
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

		options('d', {
			alias: 'debug',
			describe: 'Produce diagnostic messages to the console.',
			default: false
		});

		options('f', {
			alias: 'functional',
			describe: 'Indicates that only functional tests should be run. By default only unit tests are run',
			default: false
		});

		options('i', {
			alias: 'internConfig',
			description: 'Override the built in intern configs by specifying a path to custom intern configuration.',
			type: 'string'
		});

		options('k', {
			alias: 'testingKey',
			describe: 'API key for testingbot or accesskey for saucelabs or browserstack',
			type: 'string'
		});

		options('n', {
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
			describe: 'Indicates that only unit tests should be run. This is the default.',
			default: true
		});
	},
	run(helper: Helper, args: TestArgs) {
		function unhandledRejection(reason: any) {
			console.log('Unhandled Promise Rejection: ');
			console.log(reason);
		}

		process.on('unhandledRejection', unhandledRejection);

		return new Promise((resolve, reject) => {
			if (!helper.command.exists('build')) {
				reject(Error('Required command: \'build\', does not exist. Have you run npm install @dojo/cli-build-webpack?'));
			}
			console.log(blue.bgWhite.bold(`\n Building "${projectName}":`) + `\n`);
			const result = helper.command.run('build', '', <any> { withTests: true });
			result.then(
				() => {
					runTests(args).then(resolve, reject);
				},
				reject
			);
		});
	},
	eject(helper: Helper) {
		return {
			npm: {
				devDependencies: {
					...buildNpmDependencies()
				}
			},
			copy: {
				path: __dirname + '/intern',
				files: [
					'./intern.js',
					'./intern-browserstack.js',
					'./intern-saucelabs.js',
					'./intern-testingbot.js'
				]
			}
		};
	}
};
export default command;
