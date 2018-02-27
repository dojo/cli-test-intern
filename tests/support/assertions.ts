import { SinonStub, stub } from 'sinon';

const { assert } = intern.getPlugin('chai');

/**
 * A node-only plugin should produce a warning when ran in a non-node environment
 * @param plugin the plugin stub called by intern
 */
export function assertNotNodeEnvironment(plugin: SinonStub) {
	const oldIntern = intern;
	const mockIntern = {
		emit: stub(),
		environment: 'tacos'
	};
	try {
		(<any>global).intern = mockIntern;
		const callback = plugin.lastCall.args[1];
		callback();
		(<any>global).intern = oldIntern;
		assert.strictEqual(mockIntern.emit.callCount, 1);
		assert.strictEqual(mockIntern.emit.lastCall.args[0], 'warning');
	} finally {
		(<any>global).intern = oldIntern;
	}
}
