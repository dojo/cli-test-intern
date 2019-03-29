import { sandbox, SinonSandbox, SinonStub } from 'sinon';
import MockModule from '../../support/MockModule';
import global from '@dojo/framework/shim/global';
import { after, before } from 'intern/lib/interfaces/tdd';

const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

describe('plugins/hasTest', () => {
	let mockModule: MockModule;
	let registerPluginStub: SinonStub;
	let sinon: SinonSandbox;
	let window: any;
	let globalObj: any;
	let self: any;

	function assertRegisterPlugin() {
		assert.strictEqual(registerPluginStub.callCount, 1);
		const callback = registerPluginStub.lastCall.args[1];
		assert.isFunction(callback);

		return callback;
	}

	before(() => {
		window = global.window;
		globalObj = global.global;
		self = global.self;
	});

	after(() => {
		global.window = window;
		global.global = globalObj;
		global.self = self;
	});

	beforeEach(() => {
		sinon = sandbox.create();

		mockModule = new MockModule('../../../src/plugins/hasTest', require);
		registerPluginStub = sinon.stub(intern, 'registerPlugin');
		mockModule.getModuleUnderTest();
	});

	afterEach(() => {
		sinon.restore();
		mockModule.destroy();
	});

	it('sets has flag on the global object', () => {
		const callback = assertRegisterPlugin();
		callback();

		assert.deepEqual(global.DojoHasEnvironment, {
			staticFeatures: {
				test: true
			}
		});
	});

	it('does not overwrite other existing has flags', () => {
		global.DojoHasEnvironment = {
			staticFeatures: {
				myFeature: true
			}
		};
		const callback = assertRegisterPlugin();
		callback();

		assert.deepEqual(global.DojoHasEnvironment, {
			staticFeatures: {
				test: true,
				myFeature: true
			}
		});
	});

	it('should set it on all global objects present in the environment', () => {
		if (!global.self) {
			global.self = {};
		}

		if (!global.window) {
			global.window = {};
		}

		if (!global.global) {
			global.global = {};
		}

		const callback = assertRegisterPlugin();
		callback();

		assert.deepEqual(global.global.DojoHasEnvironment, {
			staticFeatures: {
				test: true
			}
		});

		assert.deepEqual(global.window.DojoHasEnvironment, {
			staticFeatures: {
				test: true
			}
		});

		assert.deepEqual(global.self.DojoHasEnvironment, {
			staticFeatures: {
				test: true
			}
		});
	});

	it('should work if self is not defined', () => {
		if (global.self) {
			global.self = undefined;
		}

		if (!global.window) {
			global.window = {};
		}

		if (!global.global) {
			global.global = {};
		}

		const callback = assertRegisterPlugin();
		callback();

		assert.deepEqual(global.global.DojoHasEnvironment, {
			staticFeatures: {
				test: true
			}
		});

		assert.deepEqual(global.window.DojoHasEnvironment, {
			staticFeatures: {
				test: true
			}
		});
	});
});
