/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

exports.get = function(){
	return require('daoism/dao').get({
			"dbName": "BO_ITEM",
			"properties": [{
				"name": "boi_id",
				"dbName": "BOI_ID",
				"type": "Long",
				"id": true
			},{
				"name": "boi_boh_name",
				"dbName": "BOI_BOH_NAME",
				"type": "String",
				"size": 100,
				"required": true
			},{
				"name": "boi_name",
				"dbName": "BOI_NAME",
				"type": "String",
				"size": 250,
				"required": true
			},{
				"name": "boi_column",
				"dbName": "BOI_COLUMN",
				"type": "String",
				"size": 250,
				"required": true
			},{
				"name": "boi_type",
				"dbName": "BOI_TYPE",
				"type": "String",
				"size": 250,
				"required": true
			},{
				"name": "boi_type_name",
				"dbName": "BOI_TYPE_NAME",
				"type": "String",
				"size": 250,
				"required": true
			},{
				"name": "boi_length",
				"dbName": "BOI_LENGTH",
				"type": "Int",
				"dbValue": function(value){
					return value === undefined ? 0 : value;
				},
				"value": function(dbValue){
					return dbValue < 1 ?  undefined : dbValue;
				}			
			},{
				"name": "boi_null",
				"dbName": "BOI_NULL",
				"type": "Short",
				"dbValue": function(value){
					return value === null || value === true ? 1 : 0;
				},
				"value": function(dbValue){
					return dbValue < 1 ?  false : true;
				}				
			},{
				"name": "boi_default",
				"dbName": "BOI_DEFAULT",
				"type": "String",
				"size": 250
			}]
		}, "BIZ_ItemDAO");
};

})();
