/* globals $ */
/* eslint-env node, dirigible */
(function() {
	'use strict';

	var request = require("net/http/request");	
	var response = require("net/http/response");

	var q = require("bizon/test/qunit");
	
	var attachJSONhandler = function(){
		response.setContentType("application/json; charset=UTF-8");
		response.setCharacterEncoding("UTF-8");	
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
		  response.print(JSON.stringify(data));
		  response.flush();
		  response.close();
		});	
	};
	
	var attachJUnitXmlhandler = function(){
		response.setContentType("text/xml; charset=UTF-8");
		response.setCharacterEncoding("UTF-8");
		
		q = require("bizon/test/qunit_reporter_junit");
		
		q.QUnit.jUnitDone(function(report) {
			response.print(report.xml);
			response.flush();
	 		response.close();
		});
	};
	
	var findInAcceptHeader = function(httpReqHeaderAccept, mime){
		return httpReqHeaderAccept.filter(function(entry){
			return entry.split(';')[0].trim() === mime;
		})[0];
	};
	
	var httpReqHeaderAccept = request.getHeader("Accept").replace(/\\/g,'').split(',');

	if(findInAcceptHeader(httpReqHeaderAccept, 'application/json')){
		console.info('Handling request for QUnit JSON test run results');
		attachJSONhandler();
	} else if(findInAcceptHeader(httpReqHeaderAccept, 'text/xml') || findInAcceptHeader(httpReqHeaderAccept, 'application/xml')){
		console.info('Handling request for JUnit XML test run fromat results');
		attachJUnitXmlhandler();
	} else if (findInAcceptHeader(httpReqHeaderAccept, '*/*')){
		attachJSONhandler();
	}
		
	q.QUnit.service = function() {
		q.QUnit.load();		
	};
	
	exports.QUnit = q.QUnit;
	
})();