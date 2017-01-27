import { before, beforeEach, after, afterEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import * as mockery from 'mockery';
import * as path from 'path';

import { stub, SinonStub } from 'sinon';
const cs: any = require('cross-spawn');
let spawnStub: SinonStub;
let spawnOnStub: SinonStub;
const stopAndPersistStub: SinonStub = stub();
const startStub: SinonStub = stub().returns({
	stopAndPersist: stopAndPersistStub
});
let runTests: any;

describe('runTests', () => {
	before(() => {
		mockery.enable({
			warnOnUnregistered: false
		});

		mockery.registerMock('ora', () => {
			return {
				start: startStub
			};
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

		startStub.reset();
		stopAndPersistStub.reset();
		spawnOnStub.returns(spawnOnResponse);
		spawnStub = stub(cs, 'spawn').returns(spawnOnResponse);
	});
	afterEach(() => {
		spawnStub.restore();
	});
	it('Should call spawn to run intern', async () => {
		spawnOnStub.onFirstCall().callsArg(1);
		await runTests.default({});
		assert.isTrue(spawnStub.calledOnce);
	});
	it('Should use a loading spinner', async () => {
		spawnOnStub.onFirstCall().callsArg(1);
		await runTests.default({});
		assert.isTrue(startStub.calledOnce, 'Should call start on the spinner');
		assert.isTrue(stopAndPersistStub.calledOnce, 'Should stop the spinner');
		assert.isTrue(stopAndPersistStub.firstCall.calledWithMatch('completed'),
			'Should persist completed message');
	});
	it('Should reject with an error when spawn throws an error', async () => {
		const errorMessage = 'test error message';
		spawnOnStub.onSecondCall().callsArgWith(1, new Error(errorMessage));
		try {
			await runTests.default({});
			assert.fail(null, null, 'Should not get here');
		}
		catch (error) {
			assert.equal(error.message, errorMessage);
			assert.isTrue(stopAndPersistStub.calledOnce, 'Should stop the spinner');
			assert.isTrue(stopAndPersistStub.firstCall.calledWithMatch('failed'),
				'Should persis the failed message');
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

		it('Should add reporters if provided', () => {
			const args = runTests.parseArguments({
				reporters: 'one,two'
			});

			assert.equal(args[1], 'reporters=one');
			assert.equal(args[2], 'reporters=two');
		});

		it('Should add LcovHtml reporter and console reporter if coverage argument is provided', () => {
			assert.equal(runTests.parseArguments({ coverage: true })[1], 'reporters=Runner');
			assert.equal(runTests.parseArguments({ coverage: true })[2], 'reporters=LcovHtml');
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
			assert.equal(args[2], 'reporters=LcovHtml');
			assert.notInclude('reporters=Runner', args);
			assert.equal(args.length, 4);
		});

		it('Should set testingbot tunnel config if provided', () => {
			const args = runTests.parseArguments({
				config: 'testingbot',
				testingKey: 'key',
				secret: 'secret'
			});
			assert.equal(args[1], 'tunnelOptions={ "verbose": "true", "apiKey": "key", "apiSecret": "secret" }');

			assert.equal(
				args[2],
				'webdriver={ "host": "http://hub.testingbot.com/wd/hub", "username": "key", "accessKey": "secret" }'
			);
		});

		it('Should set normal tunnel config if provided', () => {
			assert.equal(
				runTests.parseArguments({
					testingKey: 'key',
					userName: 'user'
				})[1],
				'tunnelOptions={ "username": "user", "accessKey": "key" }');
		});

		it('Should set capabilities based on project name and according to config', () => {
			const capabilitiesBase = 'capabilities={ "name": "@dojo/cli-test-intern", "project": "@dojo/cli-test-intern"';
			assert.equal(
				runTests.parseArguments({
					config: 'browserstack'
				})[1],
				capabilitiesBase + ', "fixSessionCapabilities": "false", "browserstack.debug": "false" }',
				'Didn\'t add browserstack config'
			);

			assert.equal(
				runTests.parseArguments({
					config: 'saucelabs'
				})[1],
				capabilitiesBase + ', "fixSessionCapabilities": "false" }',
				'Didn\'t add saucelabs config'
			);

			assert.equal(
				capabilitiesBase + ' }',
				runTests.parseArguments({
					config: 'anything else'
				})[1],
				'Didn\'t add default config config'
			);
		});
	});
});
