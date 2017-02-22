/* globals $ */
/* eslint-env node, dirigible */

var templateUtils = require('bizon/lib/generator/templateUtils');

exports.generate = function(projectName, packageName, fileName, tableName, tableColumns) {
	var entityName = tableName;
	var template = templateUtils.getTemplate('ScriptingServices', 'js_database_crud_extended', projectName, packageName, fileName);
	addEntityServiceParameters(template, entityName, tableName, 'table', tableColumns);
	templateUtils.generateTemplate(template);
};

function addEntityServiceParameters(template, entityName, tableName, tableType, tableColumns) {
	template.templateParameters.entityName = entityName;
	template.templateParameters.tableName = tableName;
	template.templateParameters.tableType = tableType;
	template.templateParameters.tableColumns = tableColumns;

	// Data Types Mapping
	template.templateParameters.SMALLINT = 'SMALLINT';
	template.templateParameters.INTEGER = 'INTEGER';
	template.templateParameters.BIGINT = 'BIGINT';
	template.templateParameters.FLOAT = 'FLOAT';
	template.templateParameters.DOUBLE = 'DOUBLE';
	template.templateParameters.CHAR = 'CHAR';
	template.templateParameters.VARCHAR = 'VARCHAR';
	template.templateParameters.DATE = 'DATE';
	template.templateParameters.TIME = 'TIME';
	template.templateParameters.TIMESTAMP = 'TIMESTAMP';
}
