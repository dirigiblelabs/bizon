/* globals $ */
/* eslint-env node, dirigible */

var templateUtils = require('bizon/lib/generator/templateUtils');

exports.generate = function(projectName, packageName, fileName, tableName, tableColumns, associations) {
	var entityName = tableName;
	var template = templateUtils.getTemplate('ScriptingServices', 'js_database_crud_da', projectName, packageName, fileName);
	addEntityServiceParameters(template, entityName, tableName, 'table', tableColumns, associations);
	templateUtils.generateTemplate(template);
};

function addEntityServiceParameters(template, entityName, tableName, tableType, tableColumns, associations) {
	template.templateParameters.entityName = entityName;
	template.templateParameters.tableName = tableName;
	template.templateParameters.tableType = tableType;
	template.templateParameters.tableColumns = tableColumns;
	
	template.templateParameters.associations = associations;
	
	template.templateParameters.ONE_TO_MANY = 'one-to-many',
	template.templateParameters.MANY_TO_MANY = 'many-to-many',

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
