import * as fs from 'fs';
import { beforeEach, afterEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import * as mockery from 'mockery';
import * as sinon from 'sinon';
import MockModule from '../support/MockModule';
import { throwImmediatly } from '../support/util';

describe('main', () => {

	let moduleUnderTest: any;
	let mockModule: MockModule;
	let mockRunTests: any;
	let sandbox: sinon.SinonSandbox;
	let mockReadFile: any;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		mockModule = new MockModule('../../src/main');
		mockRunTests = {
			default: sandbox.stub().returns(Promise.resolve())
		};
		mockery.registerMock('./runTests', mockRunTests);
		moduleUnderTest = mockModule.getModuleUnderTest().default;
		sandbox.stub(console, 'log');
		mockReadFile = sandbox.stub(fs, 'readFileSync');
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('should register supported arguments', () => {
		const options = sandbox.stub();
		moduleUnderTest.register(options);

		let untestedArguments: { [key: string]: string } = {
			'a': 'all',
			'b': 'browser',
			'c': 'config',
			'cov': 'coverage',
			'f': 'functional',
			'k': 'testingKey',
			'n': 'userName',
			'r': 'reporters',
			's': 'secret',
			'u': 'unit'
		};

		for (let i = 0; i < options.callCount; i++) {
			const call = options.getCall(i);

			assert.isTrue(call.args[ 0 ] in untestedArguments);
			assert.strictEqual(call.args[ 1 ].alias, untestedArguments[ call.args[ 0 ] ]);

			delete untestedArguments[ call.args[ 0 ] ];
		}

		assert.isTrue(Object.keys(untestedArguments).length === 0, 'Not all commands are tested');
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

	it('should support eject', () => {
		mockReadFile.returns(`{
				"name": "@dojo/cli-test-intern",
				"version": "test-version",
				"dependencies": {
					"dep1": "dep1v",
					"dep2": "dep2v"
				}
			}`);

		const result = moduleUnderTest.eject({});

		assert.isTrue('npm' in result, 'expecting npm property');
		assert.isTrue('devDependencies' in result.npm, 'expecting a devDependencies property');
		assert.deepEqual(result.npm.devDependencies, {
			'dep1': 'dep1v',
			'dep2': 'dep2v'
		});

		assert.isTrue('copy' in result, 'Should have returned a list of files to copy');
		assert.isTrue('files' in result.copy, 'Should have returned a list of files to copy');
	});
});
