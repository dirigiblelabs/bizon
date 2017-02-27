/* globals $ */
/* eslint-env node, dirigible */

var dataStructuresUtils = require('bizon/lib/generator/utils/dataStructuresUtils');
var scriptingServicesUtils = require('bizon/lib/generator/utils/scriptingServicesUtils');
var webContentUtils = require('bizon/lib/generator/utils/webContentUtils');

require('arestme/http').get()
.addResourceHandler('', 'post', function(ctx, io){

	this.logger.info('Application generation requested');
	var template = null;
	try {
		template = JSON.parse(io.request.readInputText());
	} catch (e) {
		this.logger.error(e.message, e);
		this.sendError(400, 'Invalid request payload: ' + e.message);
		return;
	}

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
		var scriptingServicesAssociations = template.scriptingServices[i].associations;
		scriptingServicesUtils.generate(projectName, packageName, scriptingServicesFileName, scriptingServicesTableName, scriptingServicesColumns, scriptingServicesAssociations);
	}

	for (var i = 0 ; i < template.webContent.length; i ++) {
		var webContentFileName = template.webContent[i].fileName;
		var webContentPageTitle = template.webContent[i].pageTitle;
		var webContentServiceFileName = template.webContent[i].serviceFileName;
		var webContentColumns = template.webContent[i].columns;
		webContentUtils.generate(projectName, packageName, webContentFileName, webContentPageTitle, webContentServiceFileName, webContentColumns);
	}
	
	this.logger.info('Application generation finished');
	
	io.response.setStatus(io.response.CREATED);
}).service();
