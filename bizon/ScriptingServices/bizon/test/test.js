/* globals $ */
/* eslint-env node, dirigible */
var q = require("bizon/test/qunit_console_reporter");

q.QUnit.test( "hello test", function(assert) {
	assert.ok( true, "Passed!" );
});

q.QUnit.load();