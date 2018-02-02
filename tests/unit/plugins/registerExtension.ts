import { SinonSandbox, SinonStub, sandbox } from 'sinon';
import * as mockery from 'mockery';
import MockModule from '../../support/MockModule';

const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

describe('plugins/registerExtension', () => {
	let mockModule: MockModule;
	let moduleStub: SinonStub;
	let registerPluginStub: SinonStub;
	let sinon: SinonSandbox;

	function assertProxy(proxy: any) {
		assert.strictEqual(proxy.sample, 'sample');
		assert.isFunction(proxy.toString);
		assert.isUndefined(proxy[Symbol()]);
	}

	function assertRegistration() {
		assert.strictEqual(registerPluginStub.callCount, 1);
		return registerPluginStub.lastCall.args[1];
	}

	beforeEach((test) => {
		if (intern.environment !== 'node') {
			test.skip('postcssRequirePlugin only runs in a node environment');
		} else {
			sinon = sandbox.create();
			moduleStub = sinon.stub();
			mockModule = new MockModule('../../../src/plugins/registerExtension', require);
			mockery.registerMock('css-modules-require-hook', moduleStub);
			registerPluginStub = sinon.stub(intern, 'registerPlugin');
			mockModule.getModuleUnderTest();
		}
	});

	afterEach(() => {
		sinon.restore();
		mockModule.destroy();
	});

	describe('registerPlugin', () => {
		it('registers without options; provides registerExtension', () => {
			const register = assertRegistration();
			const plugin = register();
			assert.isFunction(plugin);
		});

		it('registers options without extensions; provides registerExtension', () => {
			const register = assertRegistration();
			const plugin = register({});
			assert.isFunction(plugin);
		});

		it('registers with options; loads requires as proxies', () => {
			const register = assertRegistration();
			const plugin = register({ extensions: ['.test'] });
			assert.isFunction(plugin);

			const handler = require.extensions['.test'];
			assert.isFunction(handler);

			const proxy = require('../../support/assets/sample.test');
			assertProxy(proxy);
		});

		it('not a node environment; warns', () => {
			const oldIntern = intern;
			const mockIntern = {
				emit: sinon.stub(),
				environment: 'tacos'
			};
			try {
				(<any>global).intern = mockIntern;
				const callback = registerPluginStub.lastCall.args[1];
				callback();
				(<any>global).intern = oldIntern;
				assert.strictEqual(mockIntern.emit.callCount, 1);
				assert.strictEqual(mockIntern.emit.lastCall.args[0], 'warning');
			} finally {
				(<any>global).intern = oldIntern;
			}
		});
	});
});
