/* globals $ */
/* eslint-env node, dirigible */

var request = require('net/http/request');
var response = require('net/http/response');
var dataStructuresUtils = require('bizon/lib/generator/utils/dataStructuresUtils');
var scriptingServicesUtils = require('bizon/lib/generator/utils/scriptingServicesUtils');
var webContentUtils = require('bizon/lib/generator/utils/webContentUtils');

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
		case 'POST': 
			handlePostRequest(httpRequest, httpResponse);
			break;
		default:
			handleNotAllowedRequest(httpResponse);
	}
}

function handlePostRequest(httpRequest, httpResponse) {
	var template = getRequestBody(httpRequest);
	var projectName = template.projectName;
	var packageName = template.packageName;
	
	for (var i = 0 ; i < template.dataStructures.length; i ++) {
		var dataStructuresFileName = template.dataStructures[i].fileName;
		var dataStructuresColumns = template.dataStructures[i].columns;
		dataStructuresUtils.generate(projectName, packageName, dataStructuresFileName, dataStructuresColumns);
	}

	for (var i = 0 ; i < template.scriptingServices.length; i ++) {
		var scriptingServicesFileName = template.scriptingServices[i].fileName;
		var scriptingServicesTableName = template.scriptingServices[i].tableName;
		var scriptingServicesColumns = template.scriptingServices[i].columns;
		scriptingServicesUtils.generate(projectName, packageName, scriptingServicesFileName, scriptingServicesTableName, scriptingServicesColumns);
	}

	for (var i = 0 ; i < template.webContent.length; i ++) {
		var webContentFileName = template.webContent[i].fileName;
		var webContentPageTitle = template.webContent[i].pageTitle;
		var webContentServiceFileName = template.webContent[i].serviceFileName;
		var webContentColumns = template.webContent[i].columns;
		webContentUtils.generate(projectName, packageName, webContentFileName, webContentPageTitle, webContentServiceFileName, webContentColumns);
	}
	
	sendResponse(httpResponse, httpResponse.CREATED);
}

function handleNotAllowedRequest(httpResponse) {
	sendResponse(httpResponse, httpResponse.METHOD_NOT_ALLOWED);
}

function getRequestBody(httpRequest) {
	try {
		return JSON.parse(httpRequest.readInputText());
	} catch (e) {
		return null;
	}
}

function sendResponse(response, status, contentType, content) {
	response.setStatus(status);
	response.setContentType(contentType);
	response.println(content);
	response.flush();
	response.close();	
}
