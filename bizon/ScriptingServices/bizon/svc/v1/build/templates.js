/* globals $ */
/* eslint-env node, dirigible */

var request = require('net/http/request');
var response = require('net/http/response');

handleRequest(request, response);

function handleRequest(httpRequest, httpResponse, xss) {
	try {
		dispatchRequest(httpRequest, httpResponse, xss);
	} catch (e) {
		console.error(e);
		sendResponse(httpResponse, httpResponse.BAD_REQUEST, 'text/plain', e);
	}
}

function dispatchRequest(httpRequest, httpResponse) {
	response.setContentType('application/json; charset=UTF-8');
	response.setCharacterEncoding('UTF-8');

	switch (httpRequest.getMethod()) {
		case 'GET': 
			handleGetRequest(httpRequest, httpResponse);
			break;
		default:
			handleNotAllowedRequest(httpResponse);
	}
}

function handleGetRequest(httpRequest, httpResponse) {
	var templates = {
		"ds": [{
			"name": "ds_table", 
			"label": "Relational Database Table", 
			"description": "Relational database table template"
		}],
		"svc": [{
			"name": "svc_js_crud", 
			"label": "JavaScript Entity Service on Table",
			"description": "JavaScript RESTful entity service on a relational database table"
		}],
		"ui": [{
			"name": "ui_list_and_manage", 
			"label": "List and Manage Entity",
			"description": "List and manage entity page based on Bootstrap and AngularJS"
		}]
	};
	sendResponse(httpResponse, httpResponse.OK, 'application/json', JSON.stringify(templates));
}

function handleNotAllowedRequest(httpResponse) {
	sendResponse(httpResponse, httpResponse.METHOD_NOT_ALLOWED);
}

function sendResponse(response, status, contentType, content) {
	response.setStatus(status);
	response.setContentType(contentType);
	response.println(content);
	response.flush();
	response.close();	
}
