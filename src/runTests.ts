import * as path from 'path';
import { blue, green, red, underline } from 'chalk';
import dirname, { projectName } from './dirname';
import { TestArgs } from './main';
import remapCoverage from './remapCoverage';

const cs: any = require('cross-spawn');
const pkgDir: any = require('pkg-dir');
const packagePath = pkgDir.sync(dirname);
/* Custom reporter used for reporting */
const internReporter = `${path.relative(process.cwd(), packagePath)}/reporters/Reporter`;

let logger = console.log;

export function parseArguments({ all, config, functional, internConfig, reporters, secret, testingKey, unit, userName }: TestArgs) {
	const configArg = config ? `-${config}` : '-local';
	const args = [
		internConfig
			? `config=${path.relative(process.cwd(), internConfig)}`
			: `config=${path.relative(process.cwd(), path.join(packagePath, 'intern', 'intern' + configArg))}`
	];

	if (!all && unit) {
		args.push('functionalSuites=');
	}
	else if (functional) {
		args.push('suites=');
	}

	args.push(...(reporters ? reporters.split(',').map((reporter) => `reporters=${reporter}`) : [ `reporters=${internReporter}` ]));

	if (config === 'testingbot' && testingKey && secret) {
		args.push(`tunnelOptions={ "verbose": "true", "apiKey": "${testingKey}", "apiSecret": "${secret}" }`);
		args.push(`webdriver={ "host": "http://hub.testingbot.com/wd/hub", "username": "${testingKey}", "accessKey": "${secret}" }`);
	}
	else if (userName && testingKey) {
		args.push(`tunnelOptions={ "username": "${userName}", "accessKey": "${testingKey}" }`);
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
};

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

		cs.spawn(path.resolve(`node_modules/.bin/${shouldRunInBrowser(testArgs) ? 'intern-runner' : 'intern-client'}`), parseArguments(testArgs), { stdio: 'inherit' })
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

	return testRunPromise
		.then(
			() => remapCoverage(testArgs),
			(reason) => {
				return remapCoverage(testArgs)
					.then(() => {
						throw reason;
					});
			}
		);
}
