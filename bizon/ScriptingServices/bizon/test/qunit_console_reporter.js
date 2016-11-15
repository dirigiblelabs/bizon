/* globals $ */
/* eslint-env node, dirigible */
(function() {
	'use strict';

	var q = require("bizon/test/qunit");

	var data = {
		tests: [],
		moduleTests: []
	};
	
	q.QUnit.moduleDone(function(details) {
		data.moduleTests.push(details);
	});
	q.QUnit.testDone(function(details) {
	  data.tests.push(details);
	});	
	q.QUnit.done(function( details ) {
	  data.testSuite = details;
	  console.info(JSON.stringify(data));
	});	

	exports.QUnit = q.QUnit;
	
})();
