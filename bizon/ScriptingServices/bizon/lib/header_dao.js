/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

/*var parseIntStrict = function (value) {
  if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
    return Number(value);
  return NaN;
};*/

//Prepare a JSON object for insert into DB
function _createSQLEntity(entity) {
	if(entity.dsGenEnabled === 1){
		if(entity.table !== undefined  && entity.table !== null){
			// Validation rule: up to 128 Characters, Starts with letter only, Can include or end with number, No spaces, case insensitive
			var isTableNameValid = /^[A-Za-z][A-Za-z0-9]{0,127}$/.test(entity.table);//TODO: validation needs to come from database dialect provider
			if(!isTableNameValid)
				throw new Error("Illegal arugment: table["+entity.table+"] does not comply with validation rules [128 Characters, Starts with letter only, Can include or end with numbers, No spaces, Case insensitive]");
		} else {
			var regex = new RegExp('[^a-z0-9]*', "ig");
			var tblName = entity.name.replace(regex, '');
			if(!/^[a-z]/i.test(tblName)){
				tblName = 'tbl'+ tblName;
			}
			if(tblName.length>124)
				tblName = tblName.substring(0, 124);
			tblName += createRadnomAlphanumeric(4);
			entity.table = tblName;
			this.$log.info('Generated table['+entity.table+']');
		}
		if(entity.idName !== undefined && entity.idName !== null){
			var isIdNameValid = /^[a-zA-Z_][a-zA-Z0-9_]{0,255}$/.test(entity.idName);//TODO: validation needs to come from database dialect provider
			if(!isIdNameValid)
				throw new Error("Illegal arugment: idName["+entity.idName+"] does not comply with validation rules");
		} else {
			entity.idName = "id";
			this.$log.info('Generated idName['+entity.idName+']');
		}
		if(entity.idType !== undefined && entity.idType !== null){
			/*var isIdDataTypeValid = !isNaN(entity.idType) && [0,1,2,3,4,5,6,7,8,9].indexOf(entity.idType);//TODO: extenralize valid codes
			if(!isIdDataTypeValid)
				throw new Error("Illegal arugment: idType["+entity.idType+"] does not comply with validation rules");*/
		} else {
			entity.idType = "INTEGER";
		}
	}
	if(entity.svcGenEnabled === 1){
		if(entity.svcName !== undefined && entity.svcName !== null){
			var isSvcNameValid = /^(?=[\S])[^\\ \/ : * ? " < > | ]{0,255}$/.test(entity.svcName);//TODO add inner whitespaces to validaiton here too
			if(!isSvcNameValid || /\s/g.test(entity.svcName))
				throw new Error("Illegal arugment: svcName["+entity.svcName+"] does not comply with validation rules");
		} else {
			var svcName = entity.label;
			var invalidSvcNameCharactersMatcher = new RegExp('[\\ \/ : * ? " < > | \s]', "g");
			svcName = svcName.replace(invalidSvcNameCharactersMatcher , '');
			if(!/^[a-z]/i.test(svcName)){
				svcName = 'svc'+ svcName;
			}
			if(svcName.length>251)
				svcName = svcName.substring(0, 251);			
			svcName += createRadnomAlphanumeric(4);
			entity.svcName = svcName;
			this.$log.info('Denerated svcName['+entity.svcName+']');
		}
	} 
	if(entity.uiGenEnabled === 1){
		if(entity.uiTitle !== undefined && entity.uiTitle !== null){
			if(entity.uiTitle.length>255)
				throw new Error("Illegal arugment: bo_ui_title["+entity.uiTitle+"] does not comply with validation rules. Longer than 255 characters.");
		} else {
			entity.uiTitle = entity.label;
			this.$log.info('Autoassigned uiTitle['+entity.uiTitle+']');			
		}
	}	
	this.$log.info("Transformation to DB JSON object finished: " +entity);
	return entity;
}

function createRadnomAlphanumeric(length){
	if(!length)
		length = 4;
	var power = length;
	var sliceIndex = -Math.abs(length);
    return ("0000" + (Math.random()*Math.pow(36,power) << 0).toString(36)).slice(sliceIndex);
}

exports.get = function(){

	var dao = require('daoism/dao').get({
			"dbName": "BO_HEADER",
			"properties": [{
				"name": "id",
				"dbName": "BOH_ID",
				"type": "Long",
				"id": true
			},{
				"name": "name",
				"dbName": "BOH_NAME",
				"type": "String",
				"size": 100,
			},{
				"name": "label",
				"dbName": "BOH_LABEL",
				"type": "String",
				"size": 250,
			},{
				"name": "description",
				"dbName": "BOH_DESCRIPTION",
				"type": "String",
				"size": 1000,
			},{
				"name": "table",
				"dbName": "BOH_TABLE",
				"type": "String",
				"size": 128,
			},{
				"name": "idName",
				"dbName": "BOH_ID_NAME",
				"type": "String",
				"size": 250,
			},{
				"name": "idType",
				"dbName": "BOH_ID_DATATYPE_CODE",
				"type": "String",
				"size": 250
			},{
				"name": "svcName",
				"dbName": "BOH_SVC_NAME",
				"type": "String",
				"size": 250,
			},{
				"name": "uiGenEnabled",
				"dbName": "BOH_UI_GEN_ENABLED",
				"type": "Short",
				"dbValue": function(value){
					var dbVal = 0;
					if(value && value === true)
						dbVal = 1;
					return dbVal;					
				},
				"value": function(dbValue){
					var val = false;
					if(dbValue!==null && dbValue > 0)
						val = true;
					return val;
				}
			},{
				"name": "svcGenEnabled",
				"dbName": "BOH_SVC_GEN_ENABLED",
				"type": "Short",
				"dbValue": function(value){
					var dbVal = 0;
					if(value && value === true)
						dbVal = 1;
					return dbVal;					
				},
				"value": function(dbValue){
					var val = false;
					if(dbValue!==null && dbValue > 0)
						val = true;
					return val;
				}
			},{
				"name": "dsGenEnabled",
				"dbName": "BOH_DS_GEN_ENABLED",
				"type": "Short",
				"dbValue": function(value){
					var dbVal = 0;
					if(value && value === true)
						dbVal = 1;
					return dbVal;					
				},
				"value": function(dbValue){
					var val = false;
					if(dbValue!==null && dbValue > 0)
						val = true;
					return val;
				}
			},{
				"name": "uiTitle",
				"dbName": "BOH_UI_TITLE",
				"type": "String",
				"size": 250,
			}],
			"associationSets": {
				"properties": {
					"joinKey": "entityName",
					"key": "name",
					"dao": require("bizon/lib/item_dao").get,
					"associationType": "one-to-many"
				},
				"outbound-relations": {
					"key": "name",
					"joinKey": "srcEntityName",
					"dao": require("bizon/lib/relation_dao").get,
					"associationType": "one-to-many"
				},
				"inbound-relations": {
					"key": "name",
					"joinKey": "targetEntityName",
					"dao": require("bizon/lib/relation_dao").get,
					"associationType": "one-to-many"
				},
				"inbound-entities": {
					"key": "name",
					"joinKey": "srcEntityName",
					"daoJoin": require("bizon/lib/relation_dao").get,
					"associationType": "many-to-many"
				}
			}
		}, "BIZ_HeaderDAO");
		
	var originalFunc = require('daoism/dao').DAO.prototype.createSQLEntity;
	dao.createSQLEntity = function(entity){
		var _entity = originalFunc.apply(dao, [entity]);
		return _createSQLEntity.apply(dao, [_entity]);
	};
	
	return dao;
};

})();
