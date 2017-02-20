/* globals $ */
/* eslint-env node, dirigible */
var QUnit = require("qunit/qunit");
var mockito = require('jsmockito/jsmockito').JsMockito;
var hamcrest = require('jsmockito/jshamcrest').JsHamcrest;
hamcrest.Integration.QUnit({scope: QUnit});

QUnit.config.notrycatch  = true;

QUnit.module('rest api tests: ');

QUnit.test("get_not_found", function(assert) {
	
	var mockedRequest = mockito.mock(require('net/http/request'));
	mockito.when(mockedRequest).getMethod().thenReturn("GET");
	mockito.when(mockedRequest).getAttribute("path").thenReturn('1');	
	mockito.when(mockedRequest).getInfo().thenReturn({
				queryString: null
			});	
	mockito.when(mockedRequest).getHeader("Accept").thenReturn('application/json');
	mockito.when(mockedRequest).getHeader("Content-Type").thenReturn('application/json');	
	
	var mockedResponse = mockito.mock(require('net/http/response'));
	
	var ItemDAO = require('bizon/lib/item_dao');
	var mockedDAO = mockito.mock(ItemDAO);
	mockito.when(mockedDAO).find(hamcrest.Matchers.anything(), hamcrest.Matchers.anything()).thenReturn(null);
	
	var arester = require("arestme/arester");
	var Item = arester.asRestAPI(mockedDAO);
	Item.prototype.logger.ctx = "API Svc";
	var item = new Item(mockedDAO);
	
	item.service(mockedRequest, mockedResponse);	
	try {
		mockito.verify(mockedDAO).find(hamcrest.Matchers.anything(), hamcrest.Matchers.anything());
		QUnit.assertThat(mockedDAO.find(hamcrest.Matchers.anything(), hamcrest.Matchers.anything()), hamcrest.Matchers.equalTo(null), undefined, assert);
		mockito.verify(mockedResponse).setContentType("application/json; charset=UTF-8");
//		mockito.verify(mockedResponse).println(JSON.stringify(testEntity, null, 2));
	} catch (err){
		assert.ok(err===null, err.message + '\n' + (err.stack||""));
	}

});

QUnit.test("get_ok", function(assert) {
	
	var mockedRequest = mockito.mock(require('net/http/request'));
	mockito.when(mockedRequest).getMethod().thenReturn("GET");
	mockito.when(mockedRequest).getAttribute("path").thenReturn('1');	
	mockito.when(mockedRequest).getInfo().thenReturn({
				queryString: null
			});	
	mockito.when(mockedRequest).getHeader("Accept").thenReturn('application/json');
	mockito.when(mockedRequest).getHeader("Content-Type").thenReturn('application/json');	
	
	var mockedResponse = mockito.mock(require('net/http/response'));
	
	var testEntity = {
				id: 1,
				name: "test"
			};
			
	
	var ItemDAO = require('bizon/lib/item_dao');
	var mockedDAO = mockito.mock(ItemDAO);
	mockito.when(mockedDAO).find(hamcrest.Matchers.anything(), hamcrest.Matchers.anything()).thenReturn(testEntity);

	var arester = require("arestme/arester");
	var Item = arester.asRestAPI(mockedDAO);
	Item.prototype.logger.ctx = "API Svc";
	var item = new Item(mockedDAO);
	
	item.service(mockedRequest, mockedResponse);
	
	try {
		mockito.verify(mockedDAO).find(hamcrest.Matchers.anything(), hamcrest.Matchers.anything());
		QUnit.assertThat(mockedDAO.find(hamcrest.Matchers.anything(), hamcrest.Matchers.anything()), hamcrest.Matchers.equalTo(testEntity), undefined, assert);
		mockito.verify(mockedResponse).setContentType("application/json; charset=UTF-8");
		mockito.verify(mockedResponse).println(JSON.stringify(testEntity, null, 2));
	} catch (err){
		assert.ok(err===null, err.message + '\n' + (err.stack||""));
	}

});

QUnit.test("list_ok /not implemented/", function(assert) {
	assert.expect(0);
});

QUnit.test("create_ok /not implemented/", function(assert) {
	assert.expect(0);
});

QUnit.test("remove_ok /not implemented/", function(assert) {
	assert.expect(0);
});

QUnit.test("update_ok /not implemented/", function(assert) {
	assert.expect(0);
});

require("qunit/qunit_test_runner_svc").service(QUnit);
