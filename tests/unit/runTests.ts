import { before, beforeEach, after, afterEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import * as mockery from 'mockery';
import * as path from 'path';

import { stub, SinonStub } from 'sinon';
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

		mockery.registerMock('./remapCoverage', {
			default() {
				return Promise.resolve([]);
			}
		});

		runTests = require('intern/dojo/node!./../../src/runTests');
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
		assert.strictEqual(consoleStub.callCount, 5);
		assert.include(consoleStub.getCall(0).args[0], 'testing "');
		assert.include(consoleStub.getCall(1).args[0], 'Parsed arguments for intern:');
		assert.include(consoleStub.getCall(2).args[0], 'config=intern/intern');
		assert.include(consoleStub.getCall(3).args[0], 'Should run in browser:');
		assert.include(consoleStub.getCall(4).args[0], ' completed successfully');
	});
	it('Should call spawn to run intern', async () => {
		spawnOnStub.onFirstCall().callsArg(1);
		await runTests.default({});
		assert.isTrue(spawnStub.calledOnce);
	});
	it('Should run intern-client by default', async () => {
		spawnOnStub.onFirstCall().callsArg(1);
		await runTests.default({});
		assert.include(spawnStub.firstCall.args[ 0 ], 'intern-client');
	});
	it('Should run intern-runner if running in browser', async () => {
		spawnOnStub.onFirstCall().callsArg(1);
		await runTests.default({
			browser: true
		});
		assert.include(spawnStub.firstCall.args[ 0 ], 'intern-runner');
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
			assert.equal(runTests.parseArguments({config: 'test'})[0], path.join('config=intern', 'intern-test'));
		});

		it('Should have a default for intern config', () => {
			assert.equal(runTests.parseArguments({})[0], path.join('config=intern', 'intern'));
		});

		it('Should push an empty functionalSuites arg if unit is provided', () => {
			assert.equal(runTests.parseArguments({ unit: true })[1], 'functionalSuites=');
		});

		it('Should push an empty suites arg if functional is provided', () => {
			assert.equal(runTests.parseArguments({ functional: true })[1], 'suites=');
		});

		it('Should add the default Reporter if none are provided', () => {
			const args = runTests.parseArguments({});
			assert.equal(args[1], 'reporters=/reporters/Reporter');
		});

		it('Should add reporters if provided', () => {
			const args = runTests.parseArguments({
				reporters: 'one,two'
			});

			assert.equal(args[1], 'reporters=one');
			assert.equal(args[2], 'reporters=two');
		});

		it('Should not duplicate the LcovHtml reporter', () => {
			const args = runTests.parseArguments({
				reporters: 'LcovHtml',
				coverage: true
			});
			assert.equal(args[1], 'reporters=LcovHtml');
			assert.equal(args.length, 3);
		});

		it('Should not add Runner reporter if other reporters are specified', () => {
			const args = runTests.parseArguments({
				reporters: 'Pretty',
				coverage: true
			});
			assert.equal(args[1], 'reporters=Pretty');
			assert.equal(args.length, 3);
		});

		it('Should set testingbot tunnel config if provided', () => {
			const args = runTests.parseArguments({
				config: 'testingbot',
				testingKey: 'key',
				secret: 'secret'
			});
			assert.equal(args[2], 'tunnelOptions={ "verbose": "true", "apiKey": "key", "apiSecret": "secret" }');

			assert.equal(
				args[3],
				'webdriver={ "host": "http://hub.testingbot.com/wd/hub", "username": "key", "accessKey": "secret" }'
			);
		});

		it('Should set normal tunnel config if provided', () => {
			assert.equal(
				runTests.parseArguments({
					testingKey: 'key',
					userName: 'user'
				})[2],
				'tunnelOptions={ "username": "user", "accessKey": "key" }');
		});

		it('Should set a specific intern config if provided', () => {
			assert.equal(
				runTests.parseArguments({
					internConfig: 'foo/bar'
				})[0],
				'config=foo/bar'
			);
		});

		it('Should set capabilities based on project name and according to config', () => {
			const capabilitiesBase = 'capabilities={ "name": "@dojo/cli-test-intern", "project": "@dojo/cli-test-intern"';
			assert.equal(
				runTests.parseArguments({
					config: 'browserstack'
				})[2],
				capabilitiesBase + ', "fixSessionCapabilities": "false", "browserstack.debug": "false" }',
				'Didn\'t add browserstack config'
			);

			assert.equal(
				runTests.parseArguments({
					config: 'saucelabs'
				})[2],
				capabilitiesBase + ', "fixSessionCapabilities": "false" }',
				'Didn\'t add saucelabs config'
			);

			assert.equal(
				capabilitiesBase + ' }',
				runTests.parseArguments({
					config: 'anything else'
				})[2],
				'Didn\'t add default config config'
			);
		});
	});
});
