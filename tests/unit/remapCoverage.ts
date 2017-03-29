import * as fs from 'fs';
import { after, afterEach, before, beforeEach, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import * as mockery from 'mockery';
import { join } from 'path';
import { stub, SinonStub } from 'sinon';
import * as MemoryStore from 'istanbul/lib/store/memory';

let remapCoverage: any;
let loadCoverageStub: SinonStub;
let remapStub: SinonStub;
let writeReportStub: SinonStub;
let accessSyncStub: SinonStub;
let unlinkSyncStub: SinonStub;
let consoleLogStub: SinonStub;

describe('remapCoverage', () => {
	before(() => {
		loadCoverageStub = stub().returns({ foo: 'bar' });
		remapStub = stub();
		writeReportStub = stub().returns(Promise.resolve());

		accessSyncStub = stub(fs, 'accessSync').returns(undefined);
		unlinkSyncStub = stub(fs, 'unlinkSync').returns(undefined);

		mockery.enable({
			warnOnUnregistered: false
		});

		mockery.registerMock('remap-istanbul/lib/main', {
			loadCoverage: loadCoverageStub,
			remap: remapStub,
			writeReport: writeReportStub
		});

		remapCoverage = require('intern/dojo/node!./../../src/remapCoverage').default;
	});

	beforeEach(() => {
		consoleLogStub = stub(console, 'log');
	});

	after(() => {
		mockery.deregisterAll();
		mockery.disable();

		accessSyncStub.restore();
		unlinkSyncStub.restore();
	});

	afterEach(() => {
		loadCoverageStub.reset();
		remapStub.reset();
		writeReportStub.reset();
		consoleLogStub.restore();
	});

	it('should export a function by default', () => {
		assert.isFunction(remapCoverage, 'remapCoverage should be a function');
	});

	it('should return a promise that resolves with an array', () => {
		return remapCoverage({})
			.then((result: any) => {
				assert.isArray(result, 'Result should be of an Array type');
			});
	});

	it('should log debug information when debug is passed', () => {
		return remapCoverage({
				debug: true
			})
			.then(() => {
				assert.strictEqual(consoleLogStub.callCount, 4);
			});
	});

	it('should try to load coverage-final.json', () => {
		return remapCoverage({})
			.then((result: any) => {
				assert.strictEqual(loadCoverageStub.callCount, 1, 'Should have only been called once');
				assert.strictEqual(loadCoverageStub.lastCall.args.length, 1, 'Should only pass one argument');
				assert.strictEqual(loadCoverageStub.lastCall.args[0], 'coverage-final.json', 'Should try to load coverage-final.json');
			});
	});

	it('should pass loaded coverage and correct options to remap', () => {
		return remapCoverage({})
			.then((result: any) => {
				assert.strictEqual(remapStub.callCount, 1, 'Should have only been called once');
				assert.strictEqual(remapStub.lastCall.args.length, 2, 'Should have passed two arguments');
				const [ coverage, options ] = remapStub.lastCall.args;
				assert.deepEqual(coverage, { foo: 'bar' }, 'Should have passed loaded coverage');
				assert.strictEqual(Object.keys(options).length, 4, 'should have 4 properties');
				assert.property(options, 'exclude', 'Passes exclude property');
				assert.property(options, 'mapFileName', 'Passes mapFileName property');
				assert.property(options, 'sources', 'Passes sources property');
				assert.property(options, 'warn', 'Passes warn property');
				const { exclude, mapFileName, sources, warn } = options;
				assert.isFunction(exclude);
				assert.isFunction(mapFileName);
				assert.instanceOf(sources, MemoryStore);
				assert.isFunction(warn);
			});
	});

	it('should exclude the proper files from remapping', () => {
		return remapCoverage({})
			.then((result: any) => {
				const [ , options ] = remapStub.lastCall.args;
				const { exclude } = options;
				assert.isTrue(exclude('webpack:///src/foo.css?1234'));
				assert.isTrue(exclude('/src/my/bundle.ts'));
				assert.isTrue(exclude('webpack:///tests/lotsofstuff.js'));
				assert.isFalse(exclude('bundle.js'));
				assert.isFalse(exclude('./tests/bundle.js'));
				assert.isFalse(exclude('webpack:///src/foo.js'));
				assert.isFalse(exclude('webpack:///src/foo.js?1234'));
			});
	});

	it('should exclude the proper files from remapping', () => {
		return remapCoverage({
				debug: true
			})
			.then((result: any) => {
				const [ , options ] = remapStub.lastCall.args;
				const { exclude } = options;

				const logCount = consoleLogStub.callCount;
				exclude('webpack:///src/foo.css?1234');
				exclude('bundle.js');
				assert.strictEqual(consoleLogStub.callCount, logCount + 2);
			});
	});

	it('should properly map file names', () => {
		return remapCoverage({})
			.then((result: any) => {
				const [ , options ] = remapStub.lastCall.args;
				const { mapFileName } = options;
				assert.strictEqual(mapFileName('webpack:///src/foo.js?1234'), 'src/foo.js');
				assert.strictEqual(mapFileName('webpack:///src/blah/src/foo.m.ts?1234'), 'src/blah/src/foo.m.ts');
			});
	});

	it('should log mapping information when debug is specified', () => {
		return remapCoverage({
				debug: true
			})
			.then((result: any) => {
				const [ , options ] = remapStub.lastCall.args;
				const { mapFileName } = options;

				const logCount = consoleLogStub.callCount;
				mapFileName('webpack:///src/foo.js?1234');
				assert.strictEqual(consoleLogStub.callCount, logCount + 1);
			});
	});

	it('should warn properly', () => {
		const consoleWarnStub = stub(console, 'warn');
		return remapCoverage({})
			.then((result: any) => {
				const [ , options ] = remapStub.lastCall.args;
				const { warn } = options;

				const consoleLogCount = consoleLogStub.callCount;

				warn('foo');

				assert.strictEqual(consoleLogStub.callCount, consoleLogCount, 'console.log should not have been called');
				assert.strictEqual(consoleWarnStub.callCount, 1, 'Should have called console.warn once');
				assert.strictEqual(consoleWarnStub.lastCall.args[0], 'foo', 'should have logged warn properly');

				consoleWarnStub.restore();
			});
	});

	it('should log missing coverage properly', () => {
		const consoleWarnStub = stub(console, 'warn');
		return remapCoverage({})
			.then((result: any) => {
				const [ , options ] = remapStub.lastCall.args;
				const { warn } = options;

				warn(new Error('Could not find source map for foo.js'));

				assert.strictEqual(consoleLogStub.callCount, 2, 'Should have been called twice');
				assert.include(consoleLogStub.lastCall.args[0], 'WARN: ');
				assert.include(consoleLogStub.lastCall.args[0], 'Could not find source map for foo.js');

				consoleWarnStub.restore();
			});
	});

	it('should write the console report', () => {
		const collector = {};
		remapStub.returns(collector);
		return remapCoverage({})
			.then((result: any) => {
				assert.strictEqual(consoleLogStub.callCount, 1, 'console should have been called once');
				assert.include(consoleLogStub.lastCall.args[0], '▶ Code coverage for "');

				assert.strictEqual(writeReportStub.callCount, 1, 'should have been called once');
				const [ coverage, reportType, options, dest, sources ] = writeReportStub.lastCall.args;
				assert.strictEqual(collector, coverage, 'should have passed returned coverage to report');
				assert.strictEqual(reportType, 'text', 'should write a text report');
				assert.deepEqual(options, {}, 'should have passed empty object to options');
				assert.isNull(dest, 'dest should be set to null');
				assert.instanceOf(sources, MemoryStore, 'should have passed the sources');

				remapStub.returns(undefined);
			});
	});

	it('should write extra reports when options coverage is true', () => {
		const collector = {};
		remapStub.returns(collector);
		return remapCoverage({
				coverage: true,
				output: 'foo/bar'
			})
			.then((result: any) => {
				assert.strictEqual(consoleLogStub.callCount, 2, 'console should have been called twice');
				assert.include(consoleLogStub.lastCall.args[0], 'Additional coverage reports written to: ');

				assert.strictEqual(writeReportStub.callCount, 4, 'there should have been four reports written');

				let [ coverage, reportType, options, dest, sources ] = writeReportStub.getCall(0).args;
				assert.strictEqual(collector, coverage, 'should have passed returned coverage to report');
				assert.strictEqual(reportType, 'text', 'should write a text report');
				assert.deepEqual(options, {}, 'should have passed empty object to options');
				assert.isNull(dest, 'dest should be set to null');
				assert.instanceOf(sources, MemoryStore, 'should have passed the sources');

				[ coverage, reportType, options, dest, sources ] = writeReportStub.getCall(1).args;
				assert.strictEqual(collector, coverage, 'should have passed returned coverage to report');
				assert.strictEqual(reportType, 'html', 'should write a text report');
				assert.deepEqual(options, {}, 'should have passed empty object to options');
				assert.strictEqual(dest, join(process.cwd(), 'foo/bar', 'html-report'), 'dest should be set to null');
				assert.instanceOf(sources, MemoryStore, 'should have passed the sources');

				[ coverage, reportType, options, dest, sources ] = writeReportStub.getCall(2).args;
				assert.strictEqual(collector, coverage, 'should have passed returned coverage to report');
				assert.strictEqual(reportType, 'json', 'should write a text report');
				assert.deepEqual(options, {}, 'should have passed empty object to options');
				assert.strictEqual(dest, join(process.cwd(), 'foo/bar', 'coverage-final.json'), 'dest should be set to null');
				assert.instanceOf(sources, MemoryStore, 'should have passed the sources');

				[ coverage, reportType, options, dest, sources ] = writeReportStub.getCall(3).args;
				assert.strictEqual(collector, coverage, 'should have passed returned coverage to report');
				assert.strictEqual(reportType, 'lcovonly', 'should write a text report');
				assert.deepEqual(options, {}, 'should have passed empty object to options');
				assert.strictEqual(dest, join(process.cwd(), 'foo/bar', 'lcov.info'), 'dest should be set to null');
				assert.instanceOf(sources, MemoryStore, 'should have passed the sources');

				remapStub.returns(undefined);
			});
	});

	it('should log debug information when debug and coverage is passed', () => {
		return remapCoverage({
				debug: true,
				coverage: true,
				output: 'foo/bar'
			})
			.then(() => {
				assert.strictEqual(consoleLogStub.callCount, 9);
			});
	});

	it('should resolve to empty array when there is no "coverage-final.json"', () => {
		accessSyncStub.throws();
		return remapCoverage({})
			.then((result: any) => {
				assert.isArray(result, 'Should be an array');
				assert.lengthOf(result, 0, 'Should be a zero length array');
			});
	});
});
