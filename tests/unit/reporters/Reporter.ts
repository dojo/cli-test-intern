import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as Reporter from '../../../src/reporters/Reporter';

registerSuite({
	name: 'reporters/Reporter',

	basic() {
		assert.isFunction(Reporter, 'should be a constructor function');
		assert.instanceOf(new Reporter(), Reporter, 'using the new keyword should create new instances of Reporter');
	}
});
