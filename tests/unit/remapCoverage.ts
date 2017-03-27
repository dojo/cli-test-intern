import { before, after, describe, it } from 'intern!bdd';
import * as assert from 'intern/chai!assert';
import * as mockery from 'mockery';

let remapCoverage: any;

describe('remapCoverage', () => {
	before(() => {
		mockery.enable({
			warnOnUnregistered: false
		});

		remapCoverage = require('intern/dojo/node!./../../src/remapCoverage').default;
	});

	after(() => {
		mockery.deregisterAll();
		mockery.disable();
	});

	it('should export a function by default', () => {
		assert.isFunction(remapCoverage, 'remapCoverage should be a function');
	});
});
