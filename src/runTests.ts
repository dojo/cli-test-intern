import { blue, green, red, underline } from 'chalk';
import * as path from 'path';
import dirname, { projectName } from './dirname';

const cs: any = require('cross-spawn');
const pkgDir: any = require('pkg-dir');
const packagePath = pkgDir.sync(dirname);

let logger = console.log;

export interface TestOptions {
	nodeUnit?: boolean;
	remoteUnit?: boolean;
	remoteFunctional?: boolean;
	childConfig?: string;
	internConfig?: string;
	reporters?: string;
	userName?: string;
	secret?: string;
	testingKey?: string;
	verbose?: boolean;
	filter?: string;
}

export function parseArguments(testArgs: TestOptions) {
	const {
		nodeUnit,
		remoteUnit,
		remoteFunctional,
		childConfig,
		internConfig,
		reporters,
		secret,
		testingKey,
		userName,
		filter
	} = testArgs;

	const configArg = childConfig ? `@${childConfig}` : '';
	const configPath = path.relative(process.cwd(), path.join(packagePath, 'intern', internConfig + configArg));
	const args = [`config=${configPath}`];

	// by default, in the intern config, all tests are run. we need to
	// disable tests that we dont want to run
	if (!remoteUnit && !nodeUnit) {
		args.push('suites=');
	}

	if (!remoteUnit && !remoteFunctional) {
		args.push('environments=');
	} else if (!remoteFunctional) {
		args.push('functionalSuites=');
	}

	if (filter) {
		args.push('grep=' + filter);
	}

	args.push(...(reporters ? reporters.split(',').map((reporter) => `reporters=${reporter}`) : []));

	if (userName && testingKey) {
		args.push(`tunnelOptions={ "username": "${userName}", "accessKey": "${testingKey}" }`);
	}

	const capabilitiesBase = `capabilities={ "name": "${projectName()}", "project": "${projectName()}"`;
	if (childConfig === 'browserstack') {
		args.push(capabilitiesBase + ', "fixSessionCapabilities": "false", "browserstack.debug": "false" }');
	} else if (childConfig === 'saucelabs') {
		args.push(capabilitiesBase + ', "fixSessionCapabilities": "false" }');
	} else {
		args.push(capabilitiesBase + ' }');
	}

	return [...args];
}

export function setLogger(value: (message: any, ...optionalParams: any[]) => void) {
	logger = value;
}

export default async function(testArgs: TestOptions) {
	const testRunPromise = new Promise((resolve, reject) => {
		const internPath = path.resolve('node_modules/.bin/intern');
		const internArgs = parseArguments(testArgs);

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
			logger(`${blue.bold('  Intern config:')}`);
			logger('    ' + blue(String(cs.sync(internPath, ['showConfig', ...internArgs]).stdout)));
			logger(`${blue.bold('  Parsed arguments for intern:')}`);
			logger('    ' + blue(String(internArgs.join('\n    '))));
		}

		cs
			.spawn(internPath, internArgs, { stdio: 'inherit' })
			.on('close', (exitCode: number) => {
				if (exitCode) {
					fail('Tests did not complete successfully');
				} else {
					succeed();
				}
			})
			.on('error', (err: Error) => {
				fail(err.message);
			});
	});

	return testRunPromise;
}
