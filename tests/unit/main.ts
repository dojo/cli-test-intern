import * as fs from 'fs';
import * as path from 'path';
import * as mockery from 'mockery';
import * as sinon from 'sinon';
import MockModule from '../support/MockModule';
import { throwImmediately } from '../support/util';
import { Command } from '@dojo/interfaces/cli';

const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

describe('main', () => {
	let moduleUnderTest: Command;
	let mockModule: MockModule;
	let mockRunTests: any;
	let mockJavaCheck: any;
	let sandbox: sinon.SinonSandbox;
	let consoleStub: sinon.SinonStub;
	let mockReadFile: sinon.SinonStub;

	function assertLog(include: string) {
		let found = false;

		consoleStub.args.forEach((call) => {
			call.forEach((arg) => {
				if (arg.indexOf(include) >= 0) {
					found = true;
				}
			});
		});

		assert.isTrue(found, `was expecting "${include}" to be logged in the console`);
	}

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		consoleStub = sandbox.stub(console, 'log');
		mockModule = new MockModule('../../src/main', require);

		mockRunTests = {
			'default': sandbox.stub().returns(Promise.resolve())
		};
		mockery.registerMock('./runTests', mockRunTests);

		mockJavaCheck = {
			'default': sandbox.stub().returns(Promise.resolve(true))
		};
		mockery.registerMock('./javaCheck', mockJavaCheck);

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
			'f': 'functional',
			'n': 'node',
			'k': 'testingKey',
			'usr': 'userName',
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

	it('should fail if the java check fails', () => {
		mockJavaCheck['default'] = sandbox.stub().returns(Promise.resolve(false));
		return moduleUnderTest.run(<any> {}, <any> { all: true }).then(
			throwImmediately,
			(e: Error) => {
				assert.include(e.message, 'Error! Java VM could not be found.');
			}
		);
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

	it('should print browser link on success', () => {
		const helper = {
			command: {
				exists: sandbox.stub().returns(true),
				run: sandbox.stub().returns(Promise.resolve())
			}
		};
		const runTestArgs = { node: true, all: true };
		return moduleUnderTest.run(<any> helper, <any> runTestArgs).then(() => {
			assertLog('If the project directory is hosted on a local server, unit tests can also be run in browser by navigating to');
		});
	});

	it('should print browser link on failure', () => {
		const helper = {
			command: {
				exists: sandbox.stub().returns(true),
				run: sandbox.stub().returns(Promise.resolve())
			}
		};
		const runTestArgs = { node: true, all: true };
		mockRunTests.default.returns(Promise.reject('error'));
		return moduleUnderTest.run(<any> helper, <any> runTestArgs).then(() => {
			assert.fail('should have failed');
		}, () => {
			assertLog('If the project directory is hosted on a local server, unit tests can also be run in browser by navigating to');
		});
	});

	it('should print browser link with filter option', () => {
		const helper = {
			command: {
				exists: sandbox.stub().returns(true),
				run: sandbox.stub().returns(Promise.resolve())
			}
		};
		const runTestArgs = { node: true, all: true, filter: 'test' };
		return moduleUnderTest.run(<any> helper, <any> runTestArgs).then(() => {
			assertLog('If the project directory is hosted on a local server, unit tests can also be run in browser by navigating to');
			assertLog('grep=test');
		});
	});

	describe('intern config switching for forward compatibility', () => {

		it('should use intern.json for legacy tests built with cli-build-webpack', async () => {
			sandbox.stub(fs, 'existsSync', (testPath: string) => {
				if (testPath.indexOf(path.join('_build', 'tests', 'unit', 'all.js')) !== -1) {
					return true;
				}
				return false;
			});
			await moduleUnderTest.run({} as any, {} as any);
			const [ testOptions ] = mockRunTests.default.firstCall.args;
			assert.equal(testOptions.internConfig, 'intern.json');
		});

		it('should use intern-next.json for tests built with cli-build-app', async () => {
			sandbox.stub(fs, 'existsSync', (testPath: string) => {
				if (testPath.indexOf(path.join('output', 'test', 'unit.js')) !== -1) {
					return true;
				}
				return false;
			});
			await moduleUnderTest.run({} as any, {} as any);
			const [ testOptions ] = mockRunTests.default.firstCall.args;
			assert.equal(testOptions.internConfig, 'intern-next.json');
		});

		it('should throw an error if no tests are found', async () => {
			let error: Error;
			sandbox.stub(fs, 'existsSync', (path: string) => false);
			try {
				await moduleUnderTest.run({} as any, {} as any);
			} catch (e) {
				error = e;
			}
			assert.equal(error!.message, 'Could not find tests, have you built the tests using dojo build?\n\nFor @dojo/cli-build-app run: dojo build app --mode test\nFor @dojo/cli-build-webpack run: dojo build webpack --withTests');
		});

	});
});
