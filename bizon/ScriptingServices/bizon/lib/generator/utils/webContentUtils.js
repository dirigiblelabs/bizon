/* globals $ */
/* eslint-env node, dirigible */

var templateUtils = require('bizon/lib/generator/templateUtils');

exports.generate = function(projectName, packageName, fileName, pageTitle, serviceFileName, tableColumns) {
	var template = templateUtils.getTemplate('WebContentForEntity', 'list_and_manage', projectName, packageName, fileName);
	addWebContentForEntityParameters(template, pageTitle, serviceFileName, tableColumns);
	templateUtils.generateTemplate(template);
};

function addWebContentForEntityParameters(template, pageTitle, serviceFileName, tableColumns) {
	template.templateParameters.pageTitle = pageTitle;
	template.templateParameters.serviceFileName = serviceFileName;
	template.templateParameters.tableColumns = tableColumns;
}
