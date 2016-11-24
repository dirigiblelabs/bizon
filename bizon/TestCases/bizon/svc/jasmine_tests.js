/* globals $ */
/* eslint-env node, dirigible */
var j = require("jasmine/jasmine");
var jasmine = j.core(j);
var env = jasmine.getEnv();
var $$j = j.interface(jasmine, env);
var hamcrest = require("jsmockito/jshamcrest").JsHamcrest;
hamcrest.Integration.jasmine({scope: $$j});
(function($jasmine, _global){
	Object.keys($jasmine).map(function(propertyName){
		_global[propertyName] = $jasmine[propertyName];
		return propertyName;
	});
})($$j, this);


/*var console_reporter = require("jasmine/reporters/console_reporter");
env.addReporter(console_reporter.jasmine_console_reporter);*/

describe("Header REST API Test Suite", function() {
    
    var mockedRequest, mockedResponse, testEntity, restAPI, mockedDAO;
    
    beforeAll(function() {
    	testEntity = JSON.parse(JSON.stringify({
					queryString: null
				}));
    
    	mockedRequest = require('net/http/request');
    	
    	spyOn(mockedRequest, 'getMethod').and.returnValue("GET");
    	spyOn(mockedRequest, 'getAttribute').and.returnValue("1");
    	spyOn(mockedRequest, 'getInfo').and.returnValue({queryString: null});
				
    	spyOn(mockedRequest, 'getHeader').and.callFake(function(type){
    		if(type==='Accept' || type==='Content-Type')
    			return 'application/json';
    		return ;
    	});
		
		mockedResponse = require('net/http/response');
		var s;
		spyOn(mockedResponse, 'println').and.callFake(function(str){
    		s+=str;
    	});
    	spyOn(mockedResponse, 'setContentType').and.callThrough();
    	spyOn(mockedResponse, 'setCharacterEncoding').and.callThrough();
    	
		mockedDAO = require('bizon/lib/header_dao');
		spyOn(mockedDAO, 'find').and.returnValue(testEntity);
		
		var Header_REST_API = function(){};
		require("bizon/svc/rest/utils").asRestAPI.call(Header_REST_API.prototype, mockedDAO, mockedRequest, mockedResponse);	
		restAPI = new Header_REST_API(mockedDAO, mockedRequest, mockedResponse);
		
/*		var spy = jasmine.createSpy('getHandlerMock');
		restAPI.cfg['{id}'].get.handler = spy;
*/		
		restAPI.service(); 		
	});
    
    it("should get request attributes", function() {
 	        
		expect(mockedRequest.getMethod).toHaveBeenCalled();
		expect(mockedRequest.getAttribute).toHaveBeenCalledWith('path');
		
		//or
		//expect(mockedRequest.getMethod.calls.mostRecent().args).toEqual(["GET"]);
	});
	
	it("should invoke header dao find function with arguments id[1], cascaded[undefined]", function() {
		expect(mockedDAO.find).toHaveBeenCalledWith('1', undefined);		
	});
/*	it("should invoke rest api get function with context object", function() {
		expect(restAPI.cfg['{id}'].get.handler).toHaveBeenCalled();
	});*/
	
	describe("NEsted", function() {
		var spec = it("nested spec", function() {
			assertThat(1, equalTo(1), "yes", spec);
		});
	});
	
});

//Service these tests
require("jasmine/jasmine_test_runner_svc").service(env);
