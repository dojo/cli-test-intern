import { beforeEach, afterEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import * as mockery from 'mockery';
import MockModule from '../support/MockModule';
import { throwImmediatly } from '../support/util';
import * as sinon from 'sinon';

describe('main', () => {

	let moduleUnderTest: any;
	let mockModule: MockModule;
	let mockRunTests: any;
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/main');
		mockRunTests = {
			default: sandbox.stub().returns(Promise.resolve())
		};
		mockery.registerMock('./runTests', mockRunTests);
		moduleUnderTest = mockModule.getModuleUnderTest().default;
		sandbox.stub(console, 'log');
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('should register supported arguments', () => {
		const helper = { yargs: { option: sandbox.stub() } };
		moduleUnderTest.register(helper);
		assert.deepEqual(
			helper.yargs.option.firstCall.args,
			[ 'c', { alias: 'config', describe: 'Specifies what configuration to test with: \'local\'(default), \'browserstack\', \'testingbot\', or \'saucelabs\'.', type: 'string' } ],
			'First argument'
		);
		assert.deepEqual(
			helper.yargs.option.secondCall.args,
			[ 'e', { alias: 'environments', describe: 'Comma separated list of browsers to run tests in', type: 'string' }],
			'Second argument'
		);

		assert.deepEqual(
			helper.yargs.option.thirdCall.args,
			[ 'r', { alias: 'reporters', describe: 'Comma separated list of reporters to use, defaults to Console', type: 'string' }],
			'Third argument'
		);

		assert.deepEqual(
			helper.yargs.option.getCall(3).args,
			[ 'u', { alias: 'unit', describe: 'Indicates that only unit tests should be run. By default functional tests and unit tests are run' }],
			'Fourth argument'
		);

		assert.deepEqual(
			helper.yargs.option.getCall(4).args,
			[ 'f', { alias: 'functional', describe: 'Indicates that only functional tests should be run. By default functional tests and unit tests are run' }],
			'Fifth argument'
		);

		assert.deepEqual(
			helper.yargs.option.getCall(5).args,
			[ 'cov', { alias: 'coverage', describe: 'If specified coverage will be included. This is the same as adding the LcovHtml reporter' }],
			'Sixth argument'
		);

		assert.deepEqual(
			helper.yargs.option.getCall(6).args,
			[ 'k', { alias: 'testingKey', describe: 'API key for testingbot or accesskey for saucelabs or browserstack', type: 'string' }],
			'Seventh Argument'
		);

		assert.deepEqual(
			helper.yargs.option.getCall(7).args,
			[ 'n', { alias: 'userName', describe: 'User name for testing platform', type: 'string' }],
			'Eigth Argument'
		);

		assert.deepEqual(
			helper.yargs.option.getCall(8).args,
			[ 's', { alias: 'secret', describe: 'API secret for testingbot', type: 'string' }],
			'Ninth Argument'
		);
	});

	it('should check for build command and fail if it doesn\'t exist', () => {
		const helper = {
			command: {
				exists: sandbox.stub().returns(false)
			}
		};
		return moduleUnderTest.run(helper, {}).then(
			throwImmediatly,
			(e: Error) => {
				assert.isTrue(helper.command.exists.calledOnce);
				assert.equal(e.message, 'Required command: \'build\', does not exist. Have you run npm install @dojo/cli-build?');
			}
		);
	});

	it('should run the build command with appropriate arguments', () => {
		const helper = {
			command: {
				exists: sandbox.stub().returns(true),
				run: sandbox.stub().returns(Promise.resolve())
			}
		};
		const runTestArgs = { testArg: 'value' };
		return moduleUnderTest.run(helper, runTestArgs).then(() => {
			assert.isTrue(helper.command.run.calledOnce, 'Should have called run');
			assert.deepEqual(helper.command.run.firstCall.args, [ 'build', '', { withTests: true } ], 'Didn\'t call with proper arguments');
			assert.isTrue(mockRunTests.default.calledOnce, 'Should have called the runTests module');
			assert.deepEqual(mockRunTests.default.firstCall.args, [ runTestArgs ], 'Didn\'t run tests with provided arguments');
		});
	});

	it('should reject on failure', () => {
		const buildError = Error('Failed to build');
		const helper = {
			command: {
				exists: sandbox.stub().returns(true),
				run: sandbox.stub().throws(buildError)
			}
		};
		return moduleUnderTest.run(helper, {}).then(
			throwImmediatly,
			(error: any) => {
				assert.isTrue(helper.command.run.calledOnce, 'Should have called run');
				assert.deepEqual(helper.command.run.firstCall.args, [ 'build', '', { withTests: true } ], 'Didn\'t call with proper arguments');
				assert.equal('Failed to build', error.message, 'Wrong error message');
			}
		);

	});
});
