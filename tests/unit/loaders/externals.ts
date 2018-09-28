import { SinonSandbox, SinonStub, sandbox } from 'sinon';
import MockModule from '../../support/MockModule';

const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

describe('loaders/externals', () => {
	let mockModule: MockModule;
	let registerLoaderStub: SinonStub;
	let loadScriptStub: SinonStub;
	let sinon: SinonSandbox;

	function assertRegisterLoader() {
		assert.strictEqual(registerLoaderStub.callCount, 1);
		const callback = registerLoaderStub.lastCall.args[0];
		assert.isFunction(callback);

		return callback;
	}

	beforeEach((test) => {
		sinon = sandbox.create();
		mockModule = new MockModule('../../../src/loaders/externals', require);
		registerLoaderStub = sinon.stub(intern, 'registerLoader');
		loadScriptStub = sinon.stub(intern, 'loadScript').callsFake(() => Promise.resolve());

		mockModule.getModuleUnderTest();
	});

	afterEach(() => {
		sinon.restore();
		mockModule.destroy();
		delete (global as any).define;
		delete (window as any).define;
	});

	it('loader loads without options', () => {
		const callback = assertRegisterLoader();
		callback();

		assert.isTrue(loadScriptStub.calledOnce);
	});

	it('loader parses paths to load from dependencies', () => {
		const outputPath = 'outputPath';
		const dependencies = [
			'foo',
			{ inject: true },
			{ inject: false, from: 'foo' },
			{ inject: true, from: 'bar.js' },
			{ inject: 'buzz', from: 'bar', to: 'baz/' },
			{ inject: ['foo', 'bar', 'baz'], from: 'foobarbaz' }
		];
		const callback = assertRegisterLoader();
		callback({ outputPath, dependencies });

		assert.isTrue(loadScriptStub.calledOnce);
		assert.deepEqual(
			loadScriptStub.lastCall.args,
			[
				[
					'output/test/unit/outputPath/bar.js',
					'output/test/unit/outputPath/baz/buzz',
					'output/test/unit/outputPath/foobarbaz/foo',
					'output/test/unit/outputPath/foobarbaz/bar',
					'output/test/unit/outputPath/foobarbaz/baz'
				]
			],
			'Did not parse correct paths'
		);

		callback({ dependencies });
		assert.isTrue(loadScriptStub.calledTwice);
		assert.deepEqual(
			loadScriptStub.lastCall.args,
			[
				[
					'output/test/unit/externals/bar.js',
					'output/test/unit/externals/baz/buzz',
					'output/test/unit/externals/foobarbaz/foo',
					'output/test/unit/externals/foobarbaz/bar',
					'output/test/unit/externals/foobarbaz/baz'
				]
			],
			'Did not use correct default path'
		);
	});

	it('should default to loading scripts', async () => {
		const callback = assertRegisterLoader();
		const load = await callback();

		assert.isTrue(loadScriptStub.calledOnce);

		load(['foo', 'bar', 'baz']);

		assert.isTrue(loadScriptStub.calledTwice);
		assert.deepEqual(loadScriptStub.lastCall.args, [['foo', 'bar', 'baz']]);
	});

	it('should leverage a global AMD require', async () => {
		const callback = assertRegisterLoader();
		const removeStub = sinon.stub();
		const requireStub = sinon.stub().callsFake((path, callback) => {
			callback();
		});
		const requireOnStub = sinon.stub().returns({ remove: removeStub });
		const define = { amd: {} };
		const require: any = requireStub;
		require.on = requireOnStub;

		if (typeof window !== 'undefined') {
			(window as any).define = define;
			(window as any).require = require;
		} else {
			(global as any).define = define;
			(global as any).require = require;
		}

		const load = await callback();
		const path = 'relative_path';

		await load([path]);

		assert.isTrue(requireStub.calledOnce);
		assert.deepEqual(requireStub.lastCall.args[0], [`${intern.config.basePath}${path}`]);

		assert.isTrue(requireOnStub.calledOnce);
		assert.strictEqual(requireOnStub.lastCall.args[0], 'error');
		assert.isFunction(requireOnStub.lastCall.args[1]);

		assert.isTrue(removeStub.calledOnce);
	});

	it('should throw an error encountered while requiring a module', async () => {
		let errorCallback: Function;
		const callback = assertRegisterLoader();
		const errorMessage = 'Error Message';
		const removeStub = sinon.stub();
		const requireOnStub = sinon.stub().callsFake((message, onError) => {
			errorCallback = onError;
			return { remove: removeStub };
		});
		const requireStub = sinon.stub().callsFake(() => {
			if (errorCallback) {
				const emitStub = sinon.stub(intern, 'emit');
				errorCallback({ message: errorMessage });
				emitStub.restore();
				assert.isTrue(emitStub.calledOnce);
			}
		});
		const define = { amd: {} };
		const require: any = requireStub;
		require.on = requireOnStub;

		// Make sure it will use define and require from global as well
		let globalWindow: any;
		if (typeof window !== 'undefined') {
			globalWindow = window;
			delete (global as any).window;
		}
		(global as any).define = define;
		(global as any).require = require;

		const load = await callback();
		const path = '/absolute_path';

		await load([path]).then(
			() => {
				(global as any).window = globalWindow;
				throw 'Should have been rejected';
			},
			(error: Error) => {
				(global as any).window = globalWindow;
				assert.deepEqual(error.message, `AMD loader error: ${errorMessage}`);
			}
		);

		assert.isTrue(requireStub.calledOnce);
		assert.deepEqual(requireStub.lastCall.args[0], [path]);

		assert.isTrue(requireOnStub.calledOnce);
		assert.strictEqual(requireOnStub.lastCall.args[0], 'error');

		assert.isTrue(removeStub.calledOnce);
	});
});
