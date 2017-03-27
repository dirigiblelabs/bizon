/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

exports.get = function(){
	return require('daoism/dao').get({
			"dbName": "BO_PROPERTY",
			"properties": [{
				"name": "id",
				"dbName": "BOP_ID",
				"type": "Long",
				"id": true
			},{
				"name": "entityName",
				"dbName": "BOP_BOH_NAME",
				"type": "String",
				"size": 128,
				"required": true
			},{
				"name": "name",
				"dbName": "BOP_NAME",
				"type": "String",
				"size": 128,
				"required": true
			},{
				"name": "label",
				"dbName": "BOP_LABEL",
				"type": "String",
				"size": 250
			},{
				"name": "column",
				"dbName": "BOP_COLUMN",
				"type": "String",
				"size": 250,
				"required": true
			},{
				"name": "type",
				"dbName": "BOP_DATA_TYPE",
				"type": "String",
				"size": 250,
				"required": true
			},{
				"name": "typeLabel",
				"dbName": "BOP_DATA_TYPE_LABEL",
				"type": "String",
				"size": 250,
				"required": true
			},{
				"name": "isPrimaryKey",
				"dbName": "BOP_IS_PRIMARY_KEY",
				"type": "Short",
				"dbValue": function(value){
					return value === null || value === true ? 1 : 0;
				},
				"value": function(dbValue){
					return dbValue < 1 ?  false : true;
				}				
			},{
				"name": "managingRelationName",
				"dbName": "BOP_REL_NAME",
				"type": "String",
				"size": 128
			},{
				"name": "size",
				"dbName": "BOP_LENGTH",
				"type": "Int",
				"dbValue": function(value){
					return value === undefined ? 0 : value;
				},
				"value": function(dbValue){
					return dbValue < 1 ?  undefined : dbValue;
				}			
			},{
				"name": "required",
				"dbName": "BOP_NULL",
				"type": "Short",
				"dbValue": function(value){
					return value === null || value === true ? 1 : 0;
				},
				"value": function(dbValue){
					return dbValue < 1 ?  false : true;
				}				
			},{
				"name": "order",
				"dbName": "BOP_ORDER",
				"type": "Short"
			},{
				"name": "defaultValue",
				"dbName": "BOP_DEFAULT",
				"type": "String",
				"size": 250
			}]
		}, "BIZ_PropertyDAO");
};

})();
