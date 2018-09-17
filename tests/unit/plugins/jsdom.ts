import { sandbox, SinonSandbox, SinonStub } from 'sinon';
import MockModule from '../../support/MockModule';
import { assertNotNodeEnvironment } from '../../support/assertions';
import global from '@dojo/framework/shim/global';
import * as mockery from 'mockery';

const { beforeEach, afterEach, describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

describe('plugins/jsdom', () => {
	let mockModule: MockModule;
	let registerPluginStub: SinonStub;
	let hasAddStub: SinonStub;
	let hasExistsStub: SinonStub;
	let sinon: SinonSandbox;

	function assertRegisterPlugin() {
		assert.strictEqual(registerPluginStub.callCount, 1);
		const callback = registerPluginStub.lastCall.args[1];
		assert.isFunction(callback);

		return callback;
	}

	function assertGlobalDom() {
		assert.isDefined(global.document);
		assert.strictEqual(hasAddStub.callCount, 1);
		assert.deepEqual(hasAddStub.lastCall.args, ['jsdom', true]);
	}

	beforeEach((test) => {
		if (global.window) {
			delete global.window;
		}
		if (intern.environment !== 'node') {
			test.skip('postcssRequirePlugin only runs in a node environment');
		} else {
			sinon = sandbox.create();

			hasAddStub = sinon.stub();
			hasExistsStub = sinon.stub();
			mockModule = new MockModule('../../../src/plugins/jsdom', require);
			mockery.registerMock('@dojo/framework/has/has', { add: hasAddStub, exists: hasExistsStub });
			registerPluginStub = sinon.stub(intern, 'registerPlugin');
			mockModule.getModuleUnderTest();
		}
	});

	afterEach(() => {
		sinon.restore();
		mockModule.destroy();
	});

	it('warns when not in a node environment', () => {
		assertNotNodeEnvironment(registerPluginStub);
	});

	it('returns jsdom properties', () => {
		const callback = assertRegisterPlugin();
		const artifacts = callback();

		assert.isFunction(artifacts.createDom);
		assert.isFunction(artifacts.globalizeDom);
		assert(artifacts.jsdom);
	});

	describe('options.global', () => {
		let oldDocument: any;

		beforeEach(() => {
			oldDocument = global.document;
		});

		afterEach(() => {
			global.document = oldDocument;
		});

		it('registers a global dom when document is not set', () => {
			const callback = assertRegisterPlugin();
			delete global.document;
			hasExistsStub.returns(false);
			callback({ global: true });

			assertGlobalDom();
		});

		it('registers has test for jsdom if document exists', () => {
			const callback = assertRegisterPlugin();
			global.document = 'document';
			hasExistsStub.returns(false);
			callback({ global: true });

			assert.strictEqual(global.document, 'document');
			assert.strictEqual(hasAddStub.callCount, 1);
			assert.deepEqual(hasAddStub.lastCall.args, ['jsdom', false]);
		});
	});

	describe('createDom', () => {
		it('creates a new Dom', () => {
			const callback = assertRegisterPlugin();
			const { createDom } = callback();
			const dom: any = createDom();

			assert.isDefined(dom);
			assert.isDefined(dom.window);
		});
	});

	describe('globalizeDom', () => {
		it('creates global dom properties', () => {
			const callback = assertRegisterPlugin();
			const { createDom, globalizeDom } = callback();
			const dom: any = createDom();
			const doc = globalizeDom(dom);

			assert.isDefined(doc);
			assertGlobalDom();
		});
	});
});
