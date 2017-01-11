import { red, green } from 'chalk';
import * as path from 'path';
import dirname from './dirname';
import { TestArgs } from './main';

const cs: any = require('cross-spawn');
const ora: any = require('ora');
const pkgDir: any = require('pkg-dir');
const packagePath = pkgDir.sync(dirname);

export function parseArguments({ unit, functional, environments, config, coverage, reporters, testingKey, secret, userName }: TestArgs) {
	const configArg = config ? `-${config}` : '';
	const args = [ `config=${path.relative('.', path.join(packagePath, 'intern', 'intern' + configArg))}` ];
	if (unit) {
		args.push('functionalSuites=');
	}
	else if (functional) {
		args.push('suites=');
	}

	const environmentArgs = environments ? environments.split(',').map(
			(environment) => `environments={ "browserName": "${environment}" }`
		) : [];

	const reporterArgs = reporters ? reporters.split(',').map((reporter) => `reporters=${reporter}`) : [];
	if (coverage && reporterArgs.every((reporter) => reporter.indexOf('LcovHtml') < 0)) {
		reporterArgs.push('reporters=LcovHtml');
	}

	if (config === 'testingbot' && testingKey && secret) {
		args.push(`tunnelOptions={ "verbose": "true", "apiKey": "${testingKey}", "apiSecret": "${secret}" }`);
		args.push(`webdriver={ "host": "http://hub.testingbot.com/wd/hub", "username": "${testingKey}", "accessKey": "${secret}" }`);
	}
	else if (userName && testingKey) {
		args.push(`tunnelOptions={ "username": "${userName}", "accessKey": "${testingKey}" }`);
	}

	return [ ...args, ...environmentArgs, ...reporterArgs ];
}

export default async function (testArgs: TestArgs) {
	return new Promise((resolve, reject) => {
		const spinner = ora({
			spinner: 'dots',
			color: 'white',
			text: 'Running tests'
		}).start();
		cs.spawn(path.resolve('node_modules/.bin/intern-runner'), parseArguments(testArgs), { stdio: 'inherit' })
			.on('close', () => {
				spinner.stopAndPersist(green.bold(' completed'));
				resolve();
			})
			.on('error', (err: Error) => {
				spinner.stopAndPersist(red.bold(' failed'));
				reject(err);
			});
	});
}
