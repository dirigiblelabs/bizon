/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

//Prepare a JSON object for insert into DB
function _createSQLEntity(entity, dbEntity) {
	if(dbEntity.dsGenEnabled === 1){
		if(dbEntity.table !== undefined  && dbEntity.table !== null){
			// Validation rule: up to 128 Characters, Starts with letter only, Can include or end with number, No spaces, case insensitive
			var isTableNameValid = /^[A-Za-z][A-Za-z0-9]{0,127}$/.test(entity.table);//TODO: validation needs to come from database dialect provider
			if(!isTableNameValid)
				throw new Error("Illegal arugment: table["+dbEntity.table+"] does not comply with validation rules [128 Characters, Starts with letter only, Can include or end with numbers, No spaces, Case insensitive]");
		} else {
			var regex = new RegExp('[^a-z0-9]*', "ig");
			var tblName = dbEntity.name.replace(regex, '');
			if(!/^[a-z]/i.test(tblName)){
				tblName = 'tbl'+ tblName;
			}
			if(tblName.length>124)
				tblName = tblName.substring(0, 124);
			tblName += createRadnomAlphanumeric(4);
			dbEntity.table = tblName;
			this.$log.info('Generated table['+dbEntity.table+']');
		}
		var hasPk = false;
		if(entity.properties){
			var pks = entity.properties.filter(function(prop){
				return prop.isPrimaryKey;
			});
			if(pks.length>0){
				var isIdNameValid = /^[a-zA-Z_][a-zA-Z0-9_]{0,255}$/.test(pks[0].name);//TODO: validation needs to come from database dialect provider
				if(!isIdNameValid)
					throw new Error("Illegal pk name in entity: pk["+pks[0].name+"] does not comply with validation rules");
				hasPk = true;
			} 
		} 
		if(!hasPk){
			entity.properties = entity.properties || [];
			entity.properties.push({
				"name": "id",
				"entityName": entity.name,
				"isPrimaryKey": true,
				"required": true,
				"column": "ID",
				"label": "ID",
				"type": "BIGINT",
				"typeLabel": "Integer Number"				
			});
			this.$log.info('Generated PK property [id]');
		}
	}
	if(dbEntity.svcGenEnabled === 1){
		if(dbEntity.svcName !== undefined && dbEntity.svcName !== null){
			var isSvcNameValid = /^(?=[\S])[^\\ \/ : * ? " < > | ]{0,255}$/.test(dbEntity.svcName);//TODO add inner whitespaces to validaiton here too
			if(!isSvcNameValid || /\s/g.test(dbEntity.svcName))
				throw new Error("Illegal arugment: svcName["+dbEntity.svcName+"] does not comply with validation rules");
		} else {
			var svcName = dbEntity.label;
			var invalidSvcNameCharactersMatcher = new RegExp('[\\ \/ : * ? " < > | \s]', "g");
			svcName = svcName.replace(invalidSvcNameCharactersMatcher , '');
			if(!/^[a-z]/i.test(svcName)){
				svcName = 'svc'+ svcName;
			}
			if(svcName.length>251)
				svcName = svcName.substring(0, 251);			
			svcName += createRadnomAlphanumeric(4);
			dbEntity.svcName = svcName;
			this.$log.info('Generated svcName['+dbEntity.svcName+']');
		}
	} 
	if(dbEntity.uiGenEnabled === 1){
		if(dbEntity.uiTitle !== undefined && dbEntity.uiTitle !== null){
			if(dbEntity.uiTitle.length>255)
				throw new Error("Illegal arugment: uiTitle["+dbEntity.uiTitle+"] does not comply with validation rules. Longer than 255 characters.");
		} else {
			dbEntity.uiTitle = dbEntity.label;
			this.$log.info('Autoassigned uiTitle['+dbEntity.uiTitle+']');			
		}
	}	
	this.$log.info("Transformation to DB JSON object finished");
	return dbEntity;
}

function createRadnomAlphanumeric(length){
	if(!length)
		length = 4;
	var power = length;
	var sliceIndex = -Math.abs(length);
    return ("0000" + (Math.random()*Math.pow(36,power) << 0).toString(36)).slice(sliceIndex);
}

const orm = {
			"dbName": "BO_ENTITY",
			"properties": [{
				"name": "id",
				"dbName": "BOE_ID",
				"type": "Long",
				"id": true
			},{
				"name": "name",
				"dbName": "BOE_NAME",
				"type": "String",
				"required": true,
				"unique": true,
				"size": 128,
				"allowedOps": ['insert']
			},{
				"name": "label",
				"dbName": "BOE_LABEL",
				"type": "String",
				"size": 250,
			},{
				"name": "description",
				"dbName": "BOE_DESCRIPTION",
				"type": "String",
				"size": 1000,
			},{
				"name": "table",
				"dbName": "BOE_TABLE",
				"type": "String",
				"size": 128,
			},{
				"name": "managingRelationName",
				"dbName": "BOE_REL_NAME",
				"type": "String",
				"size": 128
			},{
				"name": "svcName",
				"dbName": "BOE_SVC_NAME",
				"type": "String",
				"size": 250,
			},{
				"name": "uiGenEnabled",
				"dbName": "BOE_UI_GEN_ENABLED",
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
				"dbName": "BOE_SVC_GEN_ENABLED",
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
				"dbName": "BOE_DS_GEN_ENABLED",
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
				"dbName": "BOE_UI_TITLE",
				"type": "String",
				"size": 250,
			}],
			"associations": [
				{ 
					"name": "properties",
					"joinKey": "entityName",
					"key": "name",
					"targetDao": require("bizon/lib/property_dao").get,
					"type": "one-to-many"
				},{ 
					"name": "outbound-relations",
					"joinKey": "srcEntityName",
					"key": "name",
					"targetDao": require("bizon/lib/relation_dao").get,
					"type": "one-to-many"
				},{ 
					"name": "inbound-relations",
					"joinKey": "targetEntityName",
					"key": "name",
					"targetDao": require("bizon/lib/relation_dao").get,
					"type": "one-to-many"
				},{ 
					"name": "outbound-entities",
					"joinKey": "srcEntityName",
					"key": "name",
					"joinDao": require("bizon/lib/relation_dao").get,
					"type": "many-to-many"
				},{ 
					"name": "inbound-entities",
					"joinKey": "targetEntityName",
					"key": "name",
					"joinDao": require("bizon/lib/relation_dao").get,
					"type": "many-to-many"
				}
			]
		};

exports.get = function(){

	var dao = require('daoism/dao').get(orm, "BIZ_EntityDAO");
		
	var originalFunc = require('daoism/dao').DAO.prototype.createSQLEntity;
	dao.createSQLEntity = function(entity){
		var dbEntity = originalFunc.apply(dao, [entity]);
		return _createSQLEntity.apply(dao, [entity, dbEntity]);
	};
	
	return dao;
};

})();
