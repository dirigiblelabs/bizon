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
	if(entity.boh_ds_gen_enabled === 1){
		if(entity.boh_table !== undefined  && entity.boh_table !== null){
			// Validation rule: up to 128 Characters, Starts with letter only, Can include or end with number, No spaces, case insensitive
			var isTableNameValid = /^[A-Za-z][A-Za-z0-9]{0,127}$/.test(entity.boh_table);//TODO: validation needs to come from database dialect provider
			if(!isTableNameValid)
				throw new Error("Illegal arugment: boh_table["+entity.boh_table+"] does not comply with validation rules [128 Characters, Starts with letter only, Can include or end with numbers, No spaces, Case insensitive]");
		} else {
			var regex = new RegExp('[^a-z0-9]*', "ig");
			var tblName = entity.boh_name.replace(regex, '');
			if(!/^[a-z]/i.test(tblName)){
				tblName = 'tbl'+ tblName;
			}
			if(tblName.length>124)
				tblName = tblName.substring(0, 124);
			tblName += createRadnomAlphanumeric(4);
			entity.boh_table = tblName;
			this.$log.info('Generated boh_table['+entity.boh_table+']');
		}
		if(entity.boh_id_name !== undefined && entity.boh_id_name !== null){
			var isIdNameValid = /^[a-zA-Z_][a-zA-Z0-9_]{0,255}$/.test(entity.boh_id_name);//TODO: validation needs to come from database dialect provider
			if(!isIdNameValid)
				throw new Error("Illegal arugment: boh_id_name["+entity.boh_id_name+"] does not comply with validation rules");
		} else {
			entity.boh_id_name = "id";
			this.$log.info('Generated boh_id_name['+entity.boh_id_name+']');
		}
		if(entity.boh_id_datatype_code !== undefined && entity.boh_id_datatype_code !== null){
			/*var isIdDataTypeValid = !isNaN(entity.boh_id_datatype_code) && [0,1,2,3,4,5,6,7,8,9].indexOf(entity.boh_id_datatype_code);//TODO: extenralize valid codes
			if(!isIdDataTypeValid)
				throw new Error("Illegal arugment: boh_id_datatype_code["+entity.boh_id_datatype_code+"] does not comply with validation rules");*/
		} else {
			entity.boh_id_datatype_code = "INTEGER";
		}
	}
	if(entity.boh_svc_gen_enabled === 1){
		if(entity.boh_svc_name !== undefined && entity.boh_svc_name !== null){
			var isSvcNameValid = /^(?=[\S])[^\\ \/ : * ? " < > | ]{0,255}$/.test(entity.boh_svc_name);//TODO add inner whitespaces to validaiton here too
			if(!isSvcNameValid || /\s/g.test(entity.boh_svc_name))
				throw new Error("Illegal arugment: boh_svc_name["+entity.boh_svc_name+"] does not comply with validation rules");
		} else {
			var svcName = entity.boh_label;
			var invalidSvcNameCharactersMatcher = new RegExp('[\\ \/ : * ? " < > | \s]', "g");
			svcName = svcName.replace(invalidSvcNameCharactersMatcher , '');
			if(!/^[a-z]/i.test(svcName)){
				svcName = 'svc'+ svcName;
			}
			if(svcName.length>251)
				svcName = svcName.substring(0, 251);			
			svcName += createRadnomAlphanumeric(4);
			entity.boh_svc_name = svcName;
			this.$log.info('Generated boh_svc_name['+entity.boh_svc_name+']');
		}
	} 
	if(entity.boh_ui_gen_enabled === 1){
		if(entity.boh_ui_title !== undefined && entity.boh_ui_title !== null){
			if(entity.boh_ui_title.length>255)
				throw new Error("Illegal arugment: bo_ui_title["+entity.boh_ui_title+"] does not comply with validation rules. Longer than 255 characters.");
		} else {
			entity.boh_ui_title = entity.boh_label;
			this.$log.info('Autoassigned boh_ui_title['+entity.boh_ui_title+']');			
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
				"name": "boh_id",
				"dbName": "BOH_ID",
				"type": "Long",
				"id": true
			},{
				"name": "boh_name",
				"dbName": "BOH_NAME",
				"type": "String",
				"size": 100,
			},{
				"name": "boh_label",
				"dbName": "BOH_LABEL",
				"type": "String",
				"size": 250,
			},{
				"name": "boh_table",
				"dbName": "BOH_TABLE",
				"type": "String",
				"size": 128,
			},{
				"name": "boh_id_name",
				"dbName": "BOH_ID_NAME",
				"type": "String",
				"size": 250,
			},{
				"name": "boh_id_datatype_code",
				"dbName": "BOH_ID_DATATYPE_CODE",
				"type": "String",
				"size": 250
			},{
				"name": "boh_svc_name",
				"dbName": "BOH_SVC_NAME",
				"type": "String",
				"size": 250,
			},{
				"name": "boh_ui_gen_enabled",
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
				"name": "boh_svc_gen_enabled",
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
				"name": "boh_ds_gen_enabled",
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
				"name": "boh_ui_title",
				"dbName": "BOH_UI_TITLE",
				"type": "String",
				"size": 250,
			}],
			"associationSets": {
				"properties": {
					"joinKey": "boi_boh_name",
					"key": "boh_name",
					"dao": require("bizon/lib/item_dao").get,
					"associationType": "one-to-many"
				},
				"outbound-relations": {
					"key": "boh_name",
					"joinKey": "bor_src_boh_name",
					"dao": require("bizon/lib/relation_dao").get,
					"associationType": "one-to-many"
				},
				"inbound-relations": {
					"key": "boh_name",
					"joinKey": "bor_target_boh_name",
					"dao": require("bizon/lib/relation_dao").get,
					"associationType": "one-to-many"
				},
				"inbound-entities": {
					"key": "boh_name",
					"joinKey": "bor_src_boh_name",
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
