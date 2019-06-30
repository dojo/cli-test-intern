import * as mockery from 'mockery';
import { TestArgs } from '../../src/main';

const { before, after, beforeEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

const javaVersionString = 'Some java version in here';
const openjdkVersionString = 'Some openjdk version in here';

describe('javaCheck', () => {
	let javaCheck: (args: TestArgs) => Promise<boolean>;

	let args: TestArgs;

	let execError: Error | undefined;
	let execStdout: string | undefined;
	let execStderr: string | undefined;

	before(() => {
		// Use mockery to replace child_process to the actuall call to the java VM does not occur.
		mockery.enable({
			warnOnUnregistered: false,
			useCleanCache: true
		});
		mockery.registerMock('child_process', {
			exec: function(command: string, callback: (err?: Error, stdout?: string, stderr?: string) => void) {
				callback(execError, execStdout, execStderr);
			}
		});

		// javaCheck has to be loaded AFTER the mock is setup.
		javaCheck = require('../../src/javaCheck').default;
	});

	beforeEach(() => {
		args = {
			all: false,
			legacy: false,
			browser: false,
			functional: false,
			unit: false,
			verbose: false,
			internConfig: '',
			node: false,
			filter: ''
		};

		execError = undefined;
		execStdout = undefined;
		execStderr = undefined;
	});

	const javaNeeded = ['all', 'functional'];
	const javaNotNeeded = ['browser', 'unit', 'node'];

	javaNeeded.forEach(function(property) {
		it(`should require java with "${property}" and fail when there is none`, () => {
			(<any>args)[property] = true;
			return javaCheck(args).then((passed: boolean) => {
				assert.isFalse(passed, `"${property}" failed`);
			});
		});
	});

	javaNeeded.forEach(function(property) {
		it(`should require java with "${property}" and fail when an error occurs`, () => {
			(<any>args)[property] = true;
			execStderr = javaVersionString;
			execStdout = javaVersionString;
			execError = new Error('something bad');
			return javaCheck(args).then((passed: boolean) => {
				assert.isFalse(passed, `"${property}" failed`);
			});
		});
	});

	javaNotNeeded.forEach(function(property) {
		it(`should not require java with "${property}"`, () => {
			(<any>args)[property] = true;
			return javaCheck(args).then((passed: boolean) => {
				assert.isTrue(passed, `"${property}" failed`);
			});
		});
	});

	javaNeeded.forEach(function(property) {
		it(`should require java with "${property}" and pass when stderr contains the version`, () => {
			(<any>args)[property] = true;
			execStderr = javaVersionString;
			return javaCheck(args).then((passed: boolean) => {
				assert.isTrue(passed, `"${property}" failed`);
			});
		});
	});

	javaNeeded.forEach(function(property) {
		it(`should require java with "${property}" and pass when stdout contains the version`, () => {
			(<any>args)[property] = true;
			execStdout = javaVersionString;
			return javaCheck(args).then((passed: boolean) => {
				assert.isTrue(passed, `"${property}" failed`);
			});
		});
	});

	javaNeeded.forEach(function(property) {
		it(`should require java (openjdk) with "${property}" and pass when stderr contains the version`, () => {
			(<any>args)[property] = true;
			execStderr = openjdkVersionString;
			return javaCheck(args).then((passed: boolean) => {
				assert.isTrue(passed, `"${property}" failed`);
			});
		});
	});

	it('should fail if no java environment variables are set', () => {
		args.all = true;
		const origEnv = process.env;
		process.env = {};
		return javaCheck(args)
			.then((passed: boolean) => {
				assert.isFalse(passed);
			})
			.then(() => {
				process.env = origEnv;
			});
	});

	it('should require java with config set to browserstack and fail when it is not available', () => {
		args.config = 'browserstack';
		return javaCheck(args).then((passed: boolean) => {
			assert.isFalse(passed);
		});
	});

	it('should require java with config set to browserstack and pass when avaiable via stdout', () => {
		args.config = 'browserstack';
		execStdout = 'Some java version exists';
		return javaCheck(args).then((passed: boolean) => {
			assert.isTrue(passed);
		});
	});

	it('should require java with config set to browserstack and pass when avaiable via stderr', () => {
		args.config = 'browserstack';
		execStderr = 'Some java version exists';
		return javaCheck(args).then((passed: boolean) => {
			assert.isTrue(passed);
		});
	});

	it('should not require java with config set to local', () => {
		args.config = 'local';
		return javaCheck(args).then((passed: boolean) => {
			assert.isTrue(passed);
		});
	});

	after(() => {
		mockery.deregisterAll();
		mockery.disable();
	});
});
