import { blue, green, red, underline } from 'chalk';
import * as path from 'path';
import dirname, { projectName } from './dirname';
import { TestArgs } from './main';

const cs: any = require('cross-spawn');
const pkgDir: any = require('pkg-dir');
const packagePath = pkgDir.sync(dirname);

let logger = console.log;

export function parseArguments(testArgs: TestArgs) {
	const { all, config, functional, internConfig, reporters, secret, testingKey, unit, userName } = testArgs;
	const configArg = config ? `@${config}` : '';
	const args = [
		internConfig
			? `config=${path.relative(process.cwd(), internConfig)}`
			: `config=${path.relative(process.cwd(), path.join(packagePath, 'intern', 'intern.json' + configArg))}`
	];

	if (functional) {
		args.push('suites=');
	}
	else if (!all && unit) {
		args.push('functionalSuites=');
	}

	args.push(...(reporters ? reporters.split(',').map((reporter) => `reporters=${reporter}`) : [ ]));

	if (config === 'testingbot' && testingKey && secret) {
		args.push(`tunnelOptions={ "verbose": "true", "hostname": "hub.testingbot.com", "apiKey": "${testingKey}", "apiSecret": "${secret}" }`);
	}
	else if (userName && testingKey) {
		args.push(`tunnelOptions={ "username": "${userName}", "apiKey": "${testingKey}" }`);
	}

	const capabilitiesBase = `capabilities={ "name": "${projectName()}", "project": "${projectName()}"`;
	if (config === 'browserstack') {
		args.push(capabilitiesBase + ', "fixSessionCapabilities": "false", "browserstack.debug": "false" }');
	}
	else if (config === 'saucelabs') {
		args.push(capabilitiesBase + ', "fixSessionCapabilities": "false" }');
	}
	else {
		args.push(capabilitiesBase + ' }');
	}

	return [ ...args ];
}

export function setLogger(value: (message: any, ...optionalParams: any[]) => void) {
	logger = value;
}

function shouldRunInBrowser(args: TestArgs) {
	return Boolean(args.browser || args.functional || args.all);
}

export default async function (testArgs: TestArgs) {
	const testRunPromise = new Promise((resolve, reject) => {

		function succeed() {
			logger('\n  ' + green('testing') + ' completed successfully');
			resolve();
		}

		function fail(err: string) {
			logger('\n  ' + red('testing') + ' failed');
			reject({
				message: err,
				exitCode: 1
			});
		}

		logger('\n' + underline(`testing "${projectName()}"...`) + `\n`);

		if (testArgs.verbose) {
			logger(`${blue.bold('  Parsed arguments for intern:')}`);
			logger('    ' + blue(String(parseArguments(testArgs).join('\n    '))));
			logger(`\n  ${blue.bold('Should run in browser:')} ${blue(shouldRunInBrowser(testArgs).toString())}\n`);
		}

		cs.spawn(path.resolve('node_modules/.bin/intern'), parseArguments(testArgs), { stdio: 'inherit' })
			.on('close', (exitCode: number) => {
				if (exitCode) {
					fail('Tests did not complete successfully');
				}
				else {
					succeed();
				}
			})
			.on('error', (err: Error) => {
				fail(err.message);
			});
	});

	return testRunPromise;
}
