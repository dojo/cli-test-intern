import * as fs from 'fs';
import * as mockery from 'mockery';
import * as sinon from 'sinon';
import MockModule from '../support/MockModule';
import { throwImmediatly } from '../support/util';
import { Command } from '@dojo/interfaces/cli';

const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

describe('main', () => {

	let moduleUnderTest: Command;
	let mockModule: MockModule;
	let mockRunTests: any;
	let sandbox: sinon.SinonSandbox;
	let consoleStub: sinon.SinonStub;
	let mockReadFile: sinon.SinonStub;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		consoleStub = sandbox.stub(console, 'log');
		mockModule = new MockModule('../../src/main');
		mockRunTests = {
			default: sandbox.stub().returns(Promise.resolve())
		};
		mockery.registerMock('./runTests', mockRunTests);
		moduleUnderTest = mockModule.getModuleUnderTest().default;
		mockReadFile = sandbox.stub(fs, 'readFileSync');
	});

	afterEach(() => {
		sandbox.restore();
		mockModule.destroy();
	});

	it('should register supported arguments', () => {
		const options = sandbox.stub();
		moduleUnderTest.register(options, <any> undefined);

		let untestedArguments: { [key: string]: string | undefined } = {
			'a': 'all',
			'c': 'config',
			'cov': 'coverage',
			'f': 'functional',
			'n': 'node',
			'k': 'testingKey',
			'usr': 'userName',
			'o': 'output',
			'r': 'reporters',
			's': 'secret',
			'u': 'unit',
			'v': 'verbose',
			'filter': undefined
		};

		for (let i = 0; i < options.callCount; i++) {
			const call = options.getCall(i);

			assert.isTrue(call.args[ 0 ] in untestedArguments, `Argument "${call.args[ 0 ]}" should be in untestedArguments`);
			assert.strictEqual(call.args[ 1 ].alias, untestedArguments[ call.args[ 0 ] ]);

			delete untestedArguments[ call.args[ 0 ] ];
		}

		assert.isTrue(Object.keys(untestedArguments).length === 0, `Not all commands are tested: "${Object.keys(untestedArguments).join('", "')}"`);
	});

	it('should check for build command and fail if it doesn\'t exist', () => {
		const helper = {
			command: {
				exists: sandbox.stub().returns(false)
			}
		};
		return moduleUnderTest.run(<any> helper, <any> {}).then(
			throwImmediatly,
			(e: Error) => {
				assert.isTrue(helper.command.exists.calledOnce);
				assert.include(e.message, `Required command: 'build', does not exist.`);
			}
		);
	});

	it('should run the build command with appropriate arguments', () => {
		mockReadFile.returns(`{
				"name": "@dojo/cli-test-intern",
				"version": "test-version"
			}`);

		const helper = {
			command: {
				exists: sandbox.stub().returns(true),
				run: sandbox.stub().returns(Promise.resolve())
			}
		};
		const runTestArgs = { node: true };
		return moduleUnderTest.run(<any> helper, <any> runTestArgs).then(() => {
			assert.isTrue(helper.command.run.calledOnce, 'Should have called run');
			assert.deepEqual(helper.command.run.firstCall.args, [ 'build', '', { withTests: true, disableLazyWidgetDetection: true } ], 'Didn\'t call with proper arguments');
			assert.isTrue(mockRunTests.default.calledOnce, 'Should have called the runTests module');
		});
	});

	it('should enable all tests when all is passed', () => {
		mockReadFile.returns(`{
				"name": "@dojo/cli-test-intern",
				"version": "test-version"
			}`);

		const helper = {
			command: {
				exists: sandbox.stub().returns(true),
				run: sandbox.stub().returns(Promise.resolve())
			}
		};
		const runTestArgs = { node: true, all: true };
		return moduleUnderTest.run(<any> helper, <any> runTestArgs).then(() => {
			assert.isTrue(mockRunTests.default.calledOnce, 'Should have called the runTests module');
			assert.strictEqual(mockRunTests.default.args[0][0].nodeUnit, true);
			assert.strictEqual(mockRunTests.default.args[0][0].remoteUnit, true);
			assert.strictEqual(mockRunTests.default.args[0][0].remoteFunctional, true);
		});
	});

	it('should enable node/remote tests when unit tests is passed', () => {
		mockReadFile.returns(`{
				"name": "@dojo/cli-test-intern",
				"version": "test-version"
			}`);

		const helper = {
			command: {
				exists: sandbox.stub().returns(true),
				run: sandbox.stub().returns(Promise.resolve())
			}
		};
		const runTestArgs = { node: true, unit: true};
		return moduleUnderTest.run(<any> helper, <any> runTestArgs).then(() => {
			assert.isTrue(mockRunTests.default.calledOnce, 'Should have called the runTests module');
			assert.strictEqual(mockRunTests.default.args[0][0].nodeUnit, true);
			assert.strictEqual(mockRunTests.default.args[0][0].remoteUnit, true);
			assert.strictEqual(mockRunTests.default.args[0][0].remoteFunctional, false);
		});
	});

	it('should enable functional, and disable node, tests when functional tests is passed', () => {
		mockReadFile.returns(`{
				"name": "@dojo/cli-test-intern",
				"version": "test-version"
			}`);

		const helper = {
			command: {
				exists: sandbox.stub().returns(true),
				run: sandbox.stub().returns(Promise.resolve())
			}
		};
		const runTestArgs = { node: true, functional: true};
		return moduleUnderTest.run(<any> helper, <any> runTestArgs).then(() => {
			assert.isTrue(mockRunTests.default.calledOnce, 'Should have called the runTests module');
			assert.strictEqual(mockRunTests.default.args[0][0].nodeUnit, false);
			assert.strictEqual(mockRunTests.default.args[0][0].remoteUnit, false);
			assert.strictEqual(mockRunTests.default.args[0][0].remoteFunctional, true);
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
		return moduleUnderTest.run(<any> helper, <any> {}).then(
			throwImmediatly,
			(error: any) => {
				assert.isTrue(helper.command.run.calledOnce, 'Should have called run');
				assert.deepEqual(helper.command.run.firstCall.args, [ 'build', '', { withTests: true, disableLazyWidgetDetection: true } ], 'Didn\'t call with proper arguments');
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

		const result = (<any> moduleUnderTest).eject({});

		assert.isTrue('npm' in result, 'expecting npm property');
		assert.isTrue('devDependencies' in result.npm, 'expecting a devDependencies property');
		assert.deepEqual(result.npm.devDependencies, {
			'dep1': 'dep1v',
			'dep2': 'dep2v'
		});

		assert.isTrue('copy' in result, 'Should have returned a list of files to copy');
		assert.isTrue('files' in result.copy, 'Should have returned a list of files to copy');
	});

	it('should fail if package.json fails to be read', () => {
		mockReadFile.throws(new Error('test error'));

		try {
			(<any> moduleUnderTest).eject({});
			assert.fail('Should not have succeeded');
		}
		catch (e) {
			assert.equal(e.message, 'Failed reading dependencies from package.json - test error');
		}
	});

	describe('promise rejections', () => {
		let originalListeners: ((reason: Error, promise: Promise<any>) => void)[] = [];

		beforeEach(() => {
			originalListeners = process.listeners('unhandledRejection');
			process.removeAllListeners('unhandledRejection');
		});

		it('should log unhandled promise rejections', () => {
			mockReadFile.returns(`{
				"name": "@dojo/cli-test-intern",
				"version": "test-version"
			}`);

			const helper = {
				command: {
					exists: sandbox.stub().returns(true),
					run() {
						Promise.reject(new Error('foo'));
					}
				}
			};

			moduleUnderTest.run(<any> helper, <any> {});

			return new Promise((resolve) => {
				setTimeout(resolve, 10);
			}).then(() => {
				assert.isTrue(consoleStub.calledWith('Unhandled Promise Rejection: '));
			});
		});

		afterEach(() => {
			process.removeAllListeners('unhandledRejection');
			originalListeners.forEach(listener => {
				process.on('unhandledRejection', listener);
			});
		});
	});
});
