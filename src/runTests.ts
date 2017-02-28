import { red, green } from 'chalk';
import * as path from 'path';
import dirname from './dirname';
import { TestArgs } from './main';

const cs: any = require('cross-spawn');
const ora: any = require('ora');
const pkgDir: any = require('pkg-dir');
const packagePath = pkgDir.sync(dirname);
const process = require('process');
const projectName = require(path.join(process.cwd(), './package.json')).name;

export function parseArguments({ all, unit, functional, config, coverage, reporters, testingKey, secret, userName }: TestArgs) {
	const configArg = config ? `-${config}` : '';
	const args = [ `config=${path.relative('.', path.join(packagePath, 'intern', 'intern' + configArg))}` ];

	if (!all && unit) {
		args.push('functionalSuites=');
	}
	else if (functional) {
		args.push('suites=');
	}

	args.push(...(reporters ? reporters.split(',').map((reporter) => `reporters=${reporter}`) : []));
	if (coverage) {
		if (args.every((reporter) => reporter.indexOf('reporters=') < 0)) {
			args.push('reporters=Runner');
		}
		if (args.every((reporter) => reporter.indexOf('reporters=LcovHtml') < 0)) {
			args.push('reporters=LcovHtml');
		}
	}

	if (config === 'testingbot' && testingKey && secret) {
		args.push(`tunnelOptions={ "verbose": "true", "apiKey": "${testingKey}", "apiSecret": "${secret}" }`);
		args.push(`webdriver={ "host": "http://hub.testingbot.com/wd/hub", "username": "${testingKey}", "accessKey": "${secret}" }`);
	}
	else if (userName && testingKey) {
		args.push(`tunnelOptions={ "username": "${userName}", "accessKey": "${testingKey}" }`);
	}

	const capabilitiesBase = `capabilities={ "name": "${projectName}", "project": "${projectName}"`;
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

function shouldRunInBrowser(args: TestArgs) {
	return args.browser || args.functional || args.all;
}

export default async function (testArgs: TestArgs) {
	return new Promise((resolve, reject) => {
		const spinner = ora({
			spinner: 'dots',
			color: 'white',
			text: 'Running tests'
		}).start();

		function succeed() {
			spinner.stopAndPersist(green.bold(' completed'));
			resolve();
		}

		function fail(err: string) {
			spinner.stopAndPersist(red.bold(' failed'));
			reject({
				message: err,
				exitCode: 1
			});
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
}
