import { Command, Helper, OptionsHelper } from '@dojo/cli/interfaces';
import { Argv } from 'yargs';
import runTests from './runTests';

export interface TestArgs extends Argv {
	all: boolean;
	browser: boolean;
	config: string;
	unit: boolean;
	functional: boolean;
	reporters: string;
	coverage: boolean;
	testingKey: string;
	secret: string;
	userName: string;
}

const command: Command = {
	description: 'test your application',
	register(options: OptionsHelper) {
		options('b', {
			alias: 'browser',
			describe: 'Indicates that unit tests should be run in the browser (default node). Note that functional tests are always run in the browser.',
			type: 'boolean'
		});

		options('c', {
			alias: 'config',
			describe: 'Specifies what configuration to test with: \'local\'(default), \'browserstack\', \'testingbot\', or \'saucelabs\'.',
			type: 'string'
		});

		options('r', {
			alias: 'reporters',
			describe: 'Comma separated list of reporters to use, defaults to Console',
			type: 'string'
		});

		options('a', {
			alias: 'all',
			describe: 'Indivates that all tests (both unit and functional) should be fun. By default, only unit tests are run.',
			default: false
		});

		options('u', {
			alias: 'unit',
			describe: 'Indicates that only unit tests should be run. This is the default.',
			default: true
		});

		options('f', {
			alias: 'functional',
			describe: 'Indicates that only functional tests should be run. By default only unit tests are run',
			default: false
		});

		options('cov', {
			alias: 'coverage',
			describe: 'If specified coverage will be included. This is the same as adding the LcovHtml reporter'
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

		options('s', {
			alias: 'secret',
			describe: 'API secret for testingbot',
			type: 'string'
		});
	},
	run(helper: Helper, args: TestArgs) {
		return new Promise((resolve, reject) => {
			if (!helper.command.exists('build')) {
				reject(Error('Required command: \'build\', does not exist. Have you run npm install @dojo/cli-build?'));
			}
			const result = helper.command.run('build', '', <any> { withTests: true });
			result.then(
				() => {
					runTests(args).then(resolve, reject);
				},
				reject
			);
		});
	}
};
export default command;
