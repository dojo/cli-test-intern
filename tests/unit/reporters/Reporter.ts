import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as UnitUnderTest from '../../../src/reporters/Reporter';

import * as fs from 'fs';
import * as mockery from 'mockery';
import * as stream from 'stream';
import { sandbox as sinonSandbox, SinonStub, SinonSandbox } from 'sinon';

let stdoutMock: NodeJS.WritableStream;

async function loadModule(mid: string): Promise<any> {
	return new Promise((resolve, reject) => {
		try {
			(<any> require)([ mid ], resolve);
		}
		catch (e) {
			reject(e);
		}
	});
}

function unloadModule(mid: string): void {
	const abs = (<any> require).toUrl(mid);
	(<any> require).undef(abs);
}

let Reporter: typeof UnitUnderTest;
let accessSyncStub: SinonStub;
let readFileSyncStub: SinonStub;
let consoleLogStub: SinonStub;
let writeReportStub: SinonStub;
let stdoutWriteStub: SinonStub;

let sandbox: SinonSandbox;

let lastOptions: any;
let reporterOptions: any;

registerSuite({
	name: 'reporters/Reporter',

	async beforeEach() {
		mockery.enable({
			warnOnUnregistered: false,
			useCleanCache: true
		});

		sandbox = sinonSandbox.create();

		writeReportStub = sandbox.stub().returns(Promise.resolve());

		class JsonReporterMock {
			writeReport = writeReportStub;

			constructor(options: any) {
				lastOptions = options;
			}
		}

		mockery.registerMock('istanbul/lib/report/json', JsonReporterMock);
		mockery.registerMock('istanbul', undefined);

		Reporter = await loadModule('./../../../src/reporters/Reporter');

		consoleLogStub = sandbox.stub(console, 'log');
		accessSyncStub = sandbox.stub(fs, 'accessSync').throws();
		readFileSyncStub = sandbox.stub(fs, 'readFileSync').returns('{}');

		stdoutWriteStub = sandbox.stub();

		stdoutMock = new stream.Writable({
			write: stdoutWriteStub
		});

		reporterOptions = {
			internConfig: {
				proxyOnly: false
			},
			output: stdoutMock
		};
	},

	afterEach() {
		stdoutMock.removeAllListeners();
		unloadModule('./../../../src/reporters/Reporter');
		sandbox.restore();
		mockery.deregisterAll();
		mockery.disable();
	},

	'standard options'() {
		const reporter = new Reporter(reporterOptions);
		assert.instanceOf(reporter, Reporter);
	},

	'suiteStart()': {
		'parent'() {
			const logCount = consoleLogStub.callCount;
			const reporter = new Reporter(reporterOptions);
			reporter.suiteStart(<any> {
				parent: {}
			});
			assert.strictEqual(consoleLogStub.callCount, logCount, 'nothing should be logged');
		},

		'no parent, but session ID'() {
			const logCount = consoleLogStub.callCount;
			const reporter = new Reporter(reporterOptions);
			reporter.suiteStart(<any> {
				sessionId: '12345',
				name: 'test'
			});
			assert.strictEqual(consoleLogStub.callCount, logCount + 1, 'one line should be logged');
		}
	},

	'suiteEnd()': {
		'parent'() {
			const logCount = consoleLogStub.callCount;
			const reporter = new Reporter(reporterOptions);
			reporter.suiteEnd(<any> {
				parent: {}
			});
			assert.strictEqual(consoleLogStub.callCount, logCount, 'nothing should be logged');
		},

		'client mode'() {
			const logCount = consoleLogStub.callCount;
			reporterOptions.mode = 'client';
			const reporter = new Reporter(reporterOptions);
			reporter.suiteEnd(<any> {});
			assert.strictEqual(consoleLogStub.callCount, logCount, 'nothing should be logged');
		},

		'failed test'() {
			const logCount = consoleLogStub.callCount;
			reporterOptions.mode = 'remote';
			const reporter = new Reporter(reporterOptions);
			reporter.suiteEnd(<any> {});
			assert.strictEqual(consoleLogStub.callCount, logCount, 'nothing should be logged');
		},

		'no errors'() {
			const logCount = consoleLogStub.callCount;
			reporterOptions.mode = 'remote';
			const reporter = new Reporter(reporterOptions);
			reporter.suiteEnd(<any> {
				name: 'test',
				tests: [],
				numFailedTests: 0,
				numTests: 0,
				numSkippedTests: 0,
				sessionId: '12345'
			});
			assert.strictEqual(consoleLogStub.callCount, logCount + 2, 'two lines should be logged');
			assert.include(consoleLogStub.lastCall.args[0], 'test: 0/0 tests failed', 'should log correct value');
		},

		'skipped tests'() {
			const logCount = consoleLogStub.callCount;
			reporterOptions.mode = 'remote';
			const reporter = new Reporter(reporterOptions);
			reporter.suiteEnd(<any> {
				name: 'test',
				tests: [],
				numFailedTests: 0,
				numTests: 1,
				numSkippedTests: 1,
				sessionId: '12345'
			});
			assert.strictEqual(consoleLogStub.callCount, logCount + 2, 'two lines should be logged');
			assert.include(consoleLogStub.lastCall.args[0], 'test: 0/1 tests failed (1 skipped)', 'should log correct value');
		},

		'suite error'() {
			const logCount = consoleLogStub.callCount;
			reporterOptions.mode = 'remote';
			const reporter = new Reporter(reporterOptions);
			reporter.suiteEnd(<any> {
				name: 'test',
				tests: [],
				numFailedTests: 1,
				numTests: 1,
				numSkippedTests: 0,
				sessionId: '12345',
				error: new Error('foo')
			});
			assert.strictEqual(consoleLogStub.callCount, logCount + 2, 'two lines should be logged');
			assert.include(consoleLogStub.lastCall.args[0], 'test: 1/1 tests failed; fatal error occurred', 'should log correct value');
		},

		'test error'() {
			const logCount = consoleLogStub.callCount;
			reporterOptions.mode = 'remote';
			const reporter = new Reporter(reporterOptions);
			reporter.suiteEnd(<any> {
				name: 'test',
				tests: [ {
					error: new Error('foo')
				} ],
				numFailedTests: 1,
				numTests: 1,
				numSkippedTests: 0,
				sessionId: '12345'
			});
			assert.strictEqual(consoleLogStub.callCount, logCount + 2, 'two lines should be logged');
			assert.include(consoleLogStub.lastCall.args[0], 'test: 1/1 tests failed', 'should log correct value');
		}
	},

	'test methods': {
		'testPass()'() {
			const stdoutCount = stdoutWriteStub.callCount;
			const reporter = new Reporter(reporterOptions);
			reporter.testPass();
			assert.strictEqual(stdoutWriteStub.callCount, stdoutCount + 1, 'test should have been recorded');
		},

		'testFail()'() {
			const stdoutCount = stdoutWriteStub.callCount;
			const reporter = new Reporter(reporterOptions);
			reporter.testFail(<any> {
				sessionId: '12345',
				timeElapsed: 1000,
				error: new Error('foo'),
				id: 'test'
			});
			reporter.testFail(<any> {
				sessionId: '12345',
				timeElapsed: 1000,
				error: new Error('foo'),
				id: 'test'
			});
			assert.strictEqual(stdoutWriteStub.callCount, stdoutCount + 1, 'test should have been recorded');
		},

		'testSkip()'() {
			const stdoutCount = stdoutWriteStub.callCount;
			const reporter = new Reporter(reporterOptions);
			reporter.testSkip();
			assert.strictEqual(stdoutWriteStub.callCount, stdoutCount + 1, 'test should have been recorded');
		}
	},

	'coverage()': {
		'client mode'() {
			reporterOptions.mode = 'client';
			const reporter = new Reporter(reporterOptions);
			reporter.suiteStart(<any> {});
			reporter.coverage('', {});
		},

		'runner mode'() {
			reporterOptions.mode = 'runner';
			const reporter = new Reporter(reporterOptions);
			reporter.suiteStart(<any> {
				sessionId: '12345'
			});
			reporter.coverage('12345', {});
		},

		'no coverage'() {
			reporterOptions.mode = 'runner';
			const reporter = new Reporter(reporterOptions);
			reporter.suiteStart(<any> {
				sessionId: '12345'
			});
			reporter.coverage('', {});
		}
	},

	'runEnd()': {
		'no failures'() {
			const reporter = new Reporter(reporterOptions);
			reporter.suiteStart(<any> {
				sessionId: '12345',
				numTests: 1,
				numFailedTests: 0,
				numSkippedTests: 0
			});
			const logCount = consoleLogStub.callCount;
			reporter.runEnd();
			assert.strictEqual(consoleLogStub.callCount, logCount + 2, 'two lines should be logged');
			assert.include(consoleLogStub.lastCall.args[0], ': tested 1 platforms, 0/1 failed', 'should log correct value');
		},

		'reporter failure'() {
			const reporter = new Reporter(reporterOptions);
			reporter.suiteStart(<any> {
				sessionId: '12345',
				numTests: 1,
				numFailedTests: 0,
				numSkippedTests: 0
			});
			reporter.hasErrors = true;
			const logCount = consoleLogStub.callCount;
			reporter.runEnd();
			assert.strictEqual(consoleLogStub.callCount, logCount + 2, 'two lines should be logged');
			assert.include(consoleLogStub.lastCall.args[0], ': tested 1 platforms, 0/1 failed; fatal error occurred', 'should log correct value');
		},

		'test failures'() {
			const reporter = new Reporter(reporterOptions);
			reporter.suiteStart(<any> {
				sessionId: '12345',
				numTests: 1,
				numFailedTests: 1,
				numSkippedTests: 0
			});
			reporter.testFail(<any> {
				sessionId: '12345',
				timeElapsed: 1000,
				error: new Error('foo'),
				id: 'test'
			});
			const logCount = consoleLogStub.callCount;
			reporter.runEnd();
			assert(consoleLogStub.callCount > (logCount + 2), 'at least two lines should be logged');
			assert.include(consoleLogStub.lastCall.args[0], ': tested 1 platforms, 1/1 failed', 'should log correct value');
		},

		'skipped tests'() {
			const reporter = new Reporter(reporterOptions);
			reporter.suiteStart(<any> {
				sessionId: '12345',
				numTests: 1,
				numFailedTests: 0,
				numSkippedTests: 1
			});
			const logCount = consoleLogStub.callCount;
			reporter.runEnd();
			assert.strictEqual(consoleLogStub.callCount, logCount + 2, 'two lines should be logged');
			assert.include(consoleLogStub.lastCall.args[0], ': tested 1 platforms, 0/1 failed (1 skipped)', 'should log correct value');
		},

		'previous coverage file'() {
			const reporter = new Reporter(reporterOptions);
			accessSyncStub.returns(true);
			reporter.suiteStart(<any> {
				sessionId: '12345',
				numTests: 1,
				numFailedTests: 0,
				numSkippedTests: 0
			});
			const logCount = consoleLogStub.callCount;
			reporter.runEnd();
			assert.strictEqual(consoleLogStub.callCount, logCount + 2, 'two lines should be logged');
			assert.include(consoleLogStub.lastCall.args[0], ': tested 1 platforms, 0/1 failed', 'should log correct value');
		}
	}
});
