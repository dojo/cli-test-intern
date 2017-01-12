import { before, beforeEach, after, afterEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import * as mockery from 'mockery';

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
			assert.equal(errorMessage, error.message);
			assert.isTrue(stopAndPersistStub.calledOnce, 'Should stop the spinner');
			assert.isTrue(stopAndPersistStub.firstCall.calledWithMatch('failed'),
				'Should persis the failed message');
		}
	});

	describe('Should parse arguments', () => {
		it('Should use config to set intern file if provided', () => {
			assert.equal('config=intern\\intern-test', runTests.parseArguments({config: 'test'})[0]);
		});

		it('Should have a default for intern config', () => {
			assert.equal('config=intern\\intern', runTests.parseArguments({})[0]);
		});

		it('Should push an empty functionalSuites arg if unit is provided', () => {
			assert.equal('functionalSuites=', runTests.parseArguments({ unit: true })[1]);
		});

		it('Should push an empty suites arg if functional is provided', () => {
			assert.equal('suites=', runTests.parseArguments({ functional: true })[1]);
		});

		it('Should add environments if provided', () => {
			const args = runTests.parseArguments({
				environments: 'one,two'
			});
			assert.equal('environments={ "browserName": "one" }', args[1]);
			assert.equal('environments={ "browserName": "two" }', args[2]);
		});

		it('Should add reporters if provided', () => {
			const args = runTests.parseArguments({
				reporters: 'one,two'
			});

			assert.equal('reporters=one', args[1]);
			assert.equal('reporters=two', args[2]);
		});

		it('Should add LcovHtml reporter if coverage argument is provided', () => {
			assert.equal('reporters=LcovHtml', runTests.parseArguments({ coverage: true })[1]);
		});

		it('Should not duplicate the LcovHtml reporter', () => {
			const args = runTests.parseArguments({
				reporters: 'LcovHtml',
				coverage: true
			});
			assert.equal('reporters=LcovHtml', args[1]);
			assert.equal(2, args.length);
		});

		it('Should set testingbot tunnel config if provided', () => {
			const args = runTests.parseArguments({
				config: 'testingbot',
				testingKey: 'key',
				secret: 'secret'
			});
			assert.equal('tunnelOptions={ "verbose": "true", "apiKey": "key", "apiSecret": "secret" }', args[1]);

			assert.equal('webdriver={ "host": "http://hub.testingbot.com/wd/hub", "username": "key", "accessKey": "secret" }', args[2]);
		});

		it('Should set normal tunnel config if provided', () => {
			assert.equal('tunnelOptions={ "username": "user", "accessKey": "key" }', runTests.parseArguments({
				testingKey: 'key',
				userName: 'user'
			})[1]);
		});
	});
});
