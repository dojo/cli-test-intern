import chalk from 'chalk';
import * as path from 'path';
import { ensureDirSync } from 'fs-extra';
import dirname, { projectName } from './dirname';

const cs: any = require('cross-spawn');
const pkgDir: any = require('pkg-dir');
const packagePath = pkgDir.sync(dirname);

let logger = console.log;

const reporterDir = path.join('output', 'coverage');
const reporterConfigurations: { [index: string]: string } = {
	benchmark: `{ "name": "benchmark", "options": { "directory": "${path.join(
		reporterDir,
		'benchmark'
	)}", "filename": "coverage.xml" } }`,
	cobertura: `{ "name": "cobertura", "options": { "directory": "${path.join(
		reporterDir,
		'cobertura'
	)}", "filename": "coverage.xml" } }`,
	htmlcoverage: `{ "name": "htmlcoverage", "options": { "directory": "${path.join(reporterDir, 'htmlcoverage')}" } }`,
	jsoncoverage: `{ "name": "jsoncoverage", "options": { "directory": "${path.join(reporterDir, 'jsoncoverage')}" } }`,
	junit: `{ "name": "junit", "options": { "filename": "${path.join(reporterDir, 'junit', 'coverage.xml')}" } }`,
	lcov: `{ "name": "lcov", "options": { "directory": "${path.join(
		reporterDir,
		'lcov'
	)}", "filename": "coverage.lcov" } }`,
	pretty: 'pretty',
	runner: 'runner',
	simple: 'simple',
	teamcity: `{ "name": "teamcity", "options": { "directory": "${path.join(
		reporterDir,
		'teamcity'
	)}", "filename": "coverage.xml" } }`
};

export interface TestOptions {
	nodeUnit?: boolean;
	remoteUnit?: boolean;
	remoteFunctional?: boolean;
	childConfig?: string;
	internConfig?: string;
	reporters?: string;
	externals?: {
		outputPath?: string;
		dependencies?: Array<
			| string
			| {
					type?: string;
					from: string;
					to?: string;
					name?: string;
					inject?: boolean | string | string[];
			  }
		>;
	};
	loaderPlugins?: string[];
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
		externals,
		reporters,
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

	if (externals) {
		if (!childConfig) {
			throw new Error(
				'Dojo JIT does not currently support externals, ' +
					'please specify a config option to run tests against the built code'
			);
		}
		args.push(
			`loader=${JSON.stringify({
				script: 'node_modules/@dojo/cli-test-intern/loaders/externals.js',
				options: externals
			})}`
		);
	}

	if (!remoteUnit && !remoteFunctional) {
		args.push('environments=');
	} else if (!remoteFunctional) {
		args.push('functionalSuites=');
	}

	if (filter) {
		args.push('grep=' + filter);
	}

	if (reporters) {
		let includeRunner = true;
		const formattedReporters = reporters
			.split(',')
			.filter((reporter) => reporterConfigurations[reporter.toLowerCase()] !== undefined)
			.map((reporter) => {
				const config = reporterConfigurations[reporter.toLowerCase()];
				try {
					const parsedConfig = JSON.parse(config);

					if (parsedConfig.options.directory) {
						ensureDirSync(parsedConfig.options.directory);
					} else {
						const directory = path.parse(parsedConfig.options.filename).dir;
						ensureDirSync(directory);
					}
				} catch {
					includeRunner = false;
				}
				return `reporters=${config}`;
			});
		if (formattedReporters.length) {
			if (includeRunner) {
				args.push('reporters=runner');
			}
			args.push(...formattedReporters);
		}
	}

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
			logger('\n  ' + chalk.green('testing') + ' completed successfully');
			resolve();
		}

		function fail(err: string) {
			logger('\n  ' + chalk.red('testing') + ' failed');
			reject({
				message: err,
				exitCode: 1
			});
		}

		logger('\n' + chalk.underline(`testing "${projectName()}"...`) + `\n`);

		if (testArgs.verbose) {
			logger(`${chalk.blue.bold('  Intern config:')}`);
			logger('    ' + chalk.blue(String(cs.sync(internPath, ['showConfig', ...internArgs]).stdout)));
			logger(`${chalk.blue.bold('  Parsed arguments for intern:')}`);
			logger('    ' + chalk.blue(String(internArgs.join('\n    '))));
		}

		cs.spawn(internPath, internArgs, { stdio: 'inherit' })
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
