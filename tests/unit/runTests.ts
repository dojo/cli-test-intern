import * as mockery from 'mockery';
import * as path from 'path';
import { SinonStub, stub } from 'sinon';

const { before, beforeEach, after, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

const cs: any = require('cross-spawn');
let spawnStub: SinonStub;
let spawnOnStub: SinonStub;
let consoleStub: SinonStub;
let runTests: any;

describe('runTests', () => {
	before(() => {
		mockery.enable({
			warnOnUnregistered: false
		});

		runTests = require('../../src/runTests');
	});
	after(() => {
		mockery.deregisterAll();
		mockery.disable();
	});
	beforeEach(() => {
		spawnOnStub = stub();
		const spawnOnResponse = {
			on: spawnOnStub
		};

		spawnOnStub.returns(spawnOnResponse);
		spawnStub = stub(cs, 'spawn').returns(spawnOnResponse);

		consoleStub = stub();
		runTests.setLogger(consoleStub);
	});
	afterEach(() => {
		spawnStub.restore();
	});
	it('Should support logging verbose information', async () => {
		spawnOnStub.onFirstCall().callsArg(1);
		await runTests.default({
			internConfig: 'intern.json',
			verbose: true
		});
		assert.strictEqual(consoleStub.callCount, 6);
		assert.include(consoleStub.getCall(0).args[0], 'testing "');
		assert.include(consoleStub.getCall(1).args[0], 'Intern config:');
		assert.include(consoleStub.getCall(3).args[0], 'Parsed arguments for intern:');
		assert.include(consoleStub.getCall(4).args[0], `config=${path.join('intern', 'intern.json')}`);
		assert.include(consoleStub.getCall(5).args[0], ' completed successfully');
	});
	it('Should call spawn to run intern', async () => {
		spawnOnStub.onFirstCall().callsArg(1);
		await runTests.default({});
		assert.isTrue(spawnStub.calledOnce);
		assert.include(spawnStub.firstCall.args[0], 'intern');
	});
	it('Should reject with an error when spawn throws an error in node', async () => {
		const errorMessage = 'test error message';
		spawnOnStub.onSecondCall().callsArgWith(1, new Error(errorMessage));
		try {
			await runTests.default({});
			assert.fail(null, null, 'Should not get here');
		} catch (error) {
			assert.equal(error.message, errorMessage);
		}
	});
	it('Should reject with an error when spawn exits cleanly with a non-zero status code in node', async () => {
		spawnOnStub.onFirstCall().callsArgWith(1, 1);
		try {
			await runTests.default({});
			assert.fail(null, null, 'Should not get here');
		} catch (error) {
			assert.strictEqual(error.exitCode, 1);
		}
	});

	it('Should reject with an error when spawn throws an error in a browser', async () => {
		const errorMessage = 'test error message';
		spawnOnStub.onSecondCall().callsArgWith(1, new Error(errorMessage));
		try {
			await runTests.default({
				browser: true
			});
			assert.fail(null, null, 'Should not get here');
		} catch (error) {
			assert.equal(error.message, errorMessage);
		}
	});
	it('Should reject with an error when spawn exits cleanly with a non-zero status code in a browser', async () => {
		spawnOnStub.onFirstCall().callsArgWith(1, 1);
		try {
			await runTests.default({
				browser: true
			});
			assert.fail(null, null, 'Should not get here');
		} catch (error) {
			assert.strictEqual(error.exitCode, 1);
		}
	});

	describe('Should parse arguments', () => {
		it('Should push an empty environments arg if functional tests and remote unit tests are not required', () => {
			assert.include(runTests.parseArguments({ remoteFunctional: false }), 'environments=');
		});

		it('Should not remove suites if they are enabled', () => {
			assert.notInclude(runTests.parseArguments({ nodeUnit: true }), 'suites=');
			assert.notInclude(runTests.parseArguments({ remoteUnit: true }), 'suites=');
		});

		it('Should remove functional suites', () => {
			assert.notInclude(runTests.parseArguments({ remoteUnit: true }), 'functionalSuites={}');
		});

		it('Should not exclude anything if its all true', () => {
			assert.notInclude(
				runTests.parseArguments({ nodeUnit: true, remoteUnit: true, remoteFunctional: true }),
				'functionalSuites='
			);
			assert.notInclude(
				runTests.parseArguments({ nodeUnit: true, remoteUnit: true, remoteFunctional: true }),
				'environments='
			);
			assert.notInclude(
				runTests.parseArguments({ nodeUnit: true, remoteUnit: true, remoteFunctional: true }),
				'suites='
			);
		});

		it('Should push an empty suites arg if functional tests are added', () => {
			assert.include(
				runTests.parseArguments({
					nodeUnit: false,
					remoteUnit: false,
					remoteFunctional: true
				}),
				'suites='
			);
		});

		it('Should ignore unsupported reporters', () => {
			const args = runTests.parseArguments({
				reporters: 'one'
			});
			assert.deepEqual(args, [
				'config=intern/undefined',
				'suites=',
				'environments=',
				'capabilities={ "name": "@dojo/cli-test-intern", "project": "@dojo/cli-test-intern" }'
			]);
		});

		it('Should not add runner if other specifie reporters output to the console', () => {
			const args = runTests.parseArguments({
				reporters: 'pretty',
				coverage: true
			});
			assert.notInclude(args, 'reporters=runner');
			assert.include(args, 'reporters=pretty');
		});

		it('Should add runner reporter if other specified reporters write output', () => {
			const args = runTests.parseArguments({
				reporters: 'junit',
				coverage: true
			});
			assert.include(args, 'reporters=runner');
			assert.include(
				args,
				`reporters={ "name": "junit", "options": { "filename": "${path.join(
					'output',
					'coverage',
					'junit',
					'coverage.xml'
				)}" } }`
			);
		});

		it('should support multiple reporters', () => {
			const args = runTests.parseArguments({
				reporters: 'lcov,pretty',
				coverage: true
			});
			assert.notInclude(args, 'reporters=runner');
			assert.include(args, 'reporters=pretty');
			assert.include(
				args,
				`reporters={ "name": "lcov", "options": { "directory": "${path.join(
					'output',
					'coverage',
					'lcov'
				)}", "filename": "coverage.lcov" } }`
			);
		});

		it('Should set normal tunnel config if provided', () => {
			assert.include(
				runTests.parseArguments({
					testingKey: 'key',
					userName: 'user'
				}),
				'tunnelOptions={ "username": "user", "accessKey": "key" }'
			);
		});

		it('Should add grep if filter provided', () => {
			assert.include(
				runTests.parseArguments({
					filter: 'test'
				}),
				'grep=test'
			);
		});

		it('Should set capabilities based on project name and according to config', () => {
			const capabilitiesBase =
				'capabilities={ "name": "@dojo/cli-test-intern", "project": "@dojo/cli-test-intern"';
			assert.include(
				runTests.parseArguments({
					childConfig: 'browserstack'
				}),
				capabilitiesBase + ', "fixSessionCapabilities": "false", "browserstack.debug": "false" }',
				"Didn't add browserstack config"
			);

			assert.include(
				runTests.parseArguments({
					childConfig: 'saucelabs'
				}),
				capabilitiesBase + ', "fixSessionCapabilities": "false" }',
				"Didn't add saucelabs config"
			);

			assert.include(
				runTests.parseArguments({
					childConfig: 'anything else'
				}),
				capabilitiesBase + ' }',
				"Didn't add default config config"
			);
		});

		it('Should pass externals to a loader if provided', () => {
			const externals = {
				dependencies: ['foo'],
				outputPath: 'bar'
			};
			assert.include(
				runTests.parseArguments({
					childConfig: 'config',
					externals
				}),
				`loader=${JSON.stringify({
					script: 'node_modules/@dojo/cli-test-intern/loaders/externals.js',
					options: externals
				})}`
			);
		});

		it('Should throw an error if externals are passed with no config specified', () => {
			assert.throws(
				() => runTests.parseArguments({ externals: {} }),
				'Dojo JIT does not currently support externals, ' +
					'please specify a config option to run tests against the built code'
			);
		});
	});
});
