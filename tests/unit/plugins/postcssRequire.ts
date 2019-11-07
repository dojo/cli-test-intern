import { SinonSandbox, SinonStub, sandbox } from 'sinon';
import * as mockery from 'mockery';
import MockModule from '../../support/MockModule';
import { assertNotNodeEnvironment } from '../../support/assertions';

const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

describe('plugins/postcssRequire', () => {
	let mockModule: MockModule;
	let moduleStub: SinonStub;
	let registerPluginStub: SinonStub;
	let sinon: SinonSandbox;

	function assertRegisterPlugin() {
		assert.strictEqual(registerPluginStub.callCount, 1);
		const callback = registerPluginStub.lastCall.args[1];
		assert.strictEqual(moduleStub.callCount, 0);
		assert.isFunction(callback);

		return callback;
	}

	beforeEach((test) => {
		if (intern.environment !== 'node') {
			test.skip('postcssRequirePlugin only runs in a node environment');
		} else {
			sinon = sandbox.create();
			moduleStub = sinon.stub();
			mockModule = new MockModule('../../../src/plugins/postcssRequire', require);
			mockery.registerMock('css-modules-require-hook', moduleStub);
			registerPluginStub = sinon.stub(intern, 'registerPlugin');
			mockModule.getModuleUnderTest();
		}
	});

	afterEach(() => {
		sinon.restore();
		mockModule.destroy();

		delete require.extensions['.css'];
	});

	it('plugin loads without options', () => {
		const callback = assertRegisterPlugin();
		callback();

		assert.strictEqual(moduleStub.callCount, 1);
		assert.deepEqual(moduleStub.lastCall.args[0], {});
	});

	it('plugin loads and passes options', () => {
		const callback = assertRegisterPlugin();
		const options = {};
		callback(options);

		assert.strictEqual(moduleStub.callCount, 1);
		assert.equal(moduleStub.lastCall.args[0], options);
	});

	it('not a node environment; warns', () => {
		assertNotNodeEnvironment(registerPluginStub);
	});

	it('wraps the postcss extension to add a key', () => {
		const callback = assertRegisterPlugin();

		require.extensions['.css'] = () => {};

		callback({});

		assert.isFunction(require.extensions['.css']);
		const result = require.extensions['.css']({ exports: {} } as any, 'test.m.css');
		assert.deepEqual(result, { exports: { ' _key': '@dojo/cli-test-intern/test' } });
	});
});
