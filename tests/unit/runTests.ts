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
			'on': spawnOnStub
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
			verbose: true
		});
		assert.strictEqual(consoleStub.callCount, 4);
		assert.include(consoleStub.getCall(0).args[ 0 ], 'testing "');
		assert.include(consoleStub.getCall(1).args[ 0 ], 'Parsed arguments for intern:');
		assert.include(consoleStub.getCall(2).args[ 0 ], `config=${path.join('intern', 'intern')}`);
		assert.include(consoleStub.getCall(3).args[ 0 ], ' completed successfully');
	});
	it('Should call spawn to run intern', async () => {
		spawnOnStub.onFirstCall().callsArg(1);
		await runTests.default({});
		assert.isTrue(spawnStub.calledOnce);
		assert.include(spawnStub.firstCall.args[ 0 ], 'intern');
	});
	it('Should reject with an error when spawn throws an error in node', async () => {
		const errorMessage = 'test error message';
		spawnOnStub.onSecondCall().callsArgWith(1, new Error(errorMessage));
		try {
			await runTests.default({});
			assert.fail(null, null, 'Should not get here');
		}
		catch (error) {
			assert.equal(error.message, errorMessage);
		}
	});
	it('Should reject with an error when spawn exits cleanly with a non-zero status code in node', async () => {
		spawnOnStub.onFirstCall().callsArgWith(1, 1);
		try {
			await runTests.default({});
			assert.fail(null, null, 'Should not get here');
		}
		catch (error) {
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
		}
		catch (error) {
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
		}
		catch (error) {
			assert.strictEqual(error.exitCode, 1);
		}
	});

	describe('Should parse arguments', () => {
		it('Should use config to set intern file if provided', () => {
			assert.equal(runTests.parseArguments({ childConfig: 'test' })[ 0 ], path.join('config=intern', 'intern.json@test'));
		});

		it('Should have a default for intern config', () => {
			assert.equal(runTests.parseArguments({})[ 0 ], path.join('config=intern', 'intern.json'));
		});

		it('Should push an empty environments arg if functional tests and remote unit tests are not required', () => {
			assert.include(runTests.parseArguments({ remoteFunctional: false }), 'environments=');
		});

		it('Should not remove node suites if node is enabled', () => {
			assert.notInclude(runTests.parseArguments({ nodeUnit: true }), 'node={}');
		});

		it('Should remove functional suites', () => {
			assert.notInclude(runTests.parseArguments({ remoteUnit: true }), 'functionalSuites={}');
		});

		it('Should remove browser suites', () => {
			assert.include(runTests.parseArguments({ remoteFunctional: true }), 'browser={}');
		});

		it('Should not exclude anything if its all true', () => {
			assert.notInclude(runTests.parseArguments({ nodeUnit: true, remoteUnit: true, remoteFunctional: true }), 'browser={}');
			assert.notInclude(runTests.parseArguments({ nodeUnit: true, remoteUnit: true, remoteFunctional: true }), 'functionalSuites=');
			assert.notInclude(runTests.parseArguments({ nodeUnit: true, remoteUnit: true, remoteFunctional: true }), 'environments=');
			assert.notInclude(runTests.parseArguments({ nodeUnit: true, remoteUnit: true, remoteFunctional: true }), 'node={}');
		});

		it('Should push an empty suites arg if functional tests are added', () => {
			assert.include(runTests.parseArguments({
				nodeUnit: false,
				remoteUnit: false,
				remoteFunctional: true
			}), 'node={}');
			assert.include(runTests.parseArguments({
				nodeUnit: false,
				remoteUnit: false,
				remoteFunctional: true
			}), 'browser={}');
		});

		it('Should add reporters if provided', () => {
			const args = runTests.parseArguments({
				reporters: 'one,two'
			});

			assert.include(args, 'reporters=one');
			assert.include(args, 'reporters=two');
		});

		it('Should not duplicate the LcovHtml reporter', () => {
			const args = runTests.parseArguments({
				reporters: 'LcovHtml',
				coverage: true
			});
			assert.strictEqual(args.reduce((count: number, arg: string) => {
				return count + (arg === 'reporters=LcovHtml' ? 1 : 0);
			}, 0), 1);
		});

		it('Should not add Runner reporter if other reporters are specified', () => {
			const args = runTests.parseArguments({
				reporters: 'Pretty',
				coverage: true
			});
			assert.include(args, 'reporters=Pretty');
			assert.notInclude(args, 'reporters=Runner');
		});

		it('Should set testingbot tunnel config if provided', () => {
			const args = runTests.parseArguments({
				childConfig: 'testingbot',
				testingKey: 'key',
				secret: 'secret'
			});
			assert.include(args, 'tunnelOptions={ "verbose": "true", "hostname": "hub.testingbot.com", "apiKey": "key", "apiSecret": "secret" }');
		});

		it('Should set normal tunnel config if provided', () => {
			assert.include(
				runTests.parseArguments({
					testingKey: 'key',
					userName: 'user'
				}),
				'tunnelOptions={ "username": "user", "apiKey": "key" }');
		});

		it('Should set a specific intern config if provided', () => {
			assert.include(
				runTests.parseArguments({
					internConfig: 'foo/bar'
				}),
				`config=${path.join('foo', 'bar')}`
			);
		});

		it('Should add grep if filter provided', () => {
			assert.include(runTests.parseArguments({
				filter: 'test'
			}), 'grep=test');
		});

		it('Should set capabilities based on project name and according to config', () => {
			const capabilitiesBase = 'capabilities={ "name": "@dojo/cli-test-intern", "project": "@dojo/cli-test-intern"';
			assert.include(
				runTests.parseArguments({
					childConfig: 'browserstack'
				}),
				capabilitiesBase + ', "fixSessionCapabilities": "false", "browserstack.debug": "false" }',
				'Didn\'t add browserstack config'
			);

			assert.include(
				runTests.parseArguments({
					childConfig: 'saucelabs'
				}),
				capabilitiesBase + ', "fixSessionCapabilities": "false" }',
				'Didn\'t add saucelabs config'
			);

			assert.include(
				runTests.parseArguments({
					childConfig: 'anything else'
				}), capabilitiesBase + ' }',
				'Didn\'t add default config config'
			);
		});
	});
});
