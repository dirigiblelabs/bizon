/* globals $ */
/* eslint-env node, dirigible */
"use strict";

var listJoins = function(settings, daos){
	var joinKey = settings['srcEntityName']===undefined?'targetEntityName':'srcEntityName';
	var joinId;
	if(typeof settings === 'string'){
		joinId = settings;
	} else if(typeof settings === 'object'){
		joinId = settings[joinKey];
	}
	this.$log.info('Finding '+daos.targetDao.orm.dbName+' entities related to '+daos.sourceDao.orm.dbName+'['+joinId+']');

	if(joinId === undefined || joinId === null){
		throw new Error('Illegal argument for id parameter:' + joinId);
	}

    var connection = this.datasource.getConnection();
    try {

		var statements = require('daoism/statements').get();
		var stmnt = statements.builder()
						.select()
						.from(daos.targetDao.orm.dbName)
						.left_join(daos.joinDao.orm.dbName, undefined, daos.joinDao.orm.getProperty("srcEntityName").dbName+'='+daos.targetDao.orm.getProperty('name').dbName)
						.where(daos.joinDao.orm.getProperty(joinKey).dbName+"=?", [daos.joinDao.orm.getProperty(joinKey)]);

		var resultSet = statements.execute(stmnt, connection, settings);
		var entities = [];
        while (resultSet.next()) {
        	var entity = daos.sourceDao.createEntity(resultSet);
        	entities.push(entity);
        }
        this.$log.info(entities.length+' '+daos.targetDao.orm.dbName+' entities related to '+daos.sourceDao.orm.dbName+'[' + joinId+ '] found');
        return entities;
    } finally {
        connection.close();
    }
};

exports.get = function(){
	var dao = require('daoism/dao').get({
			"dbName": "BO_RELATION",
			"properties": [{
				"name": "id",
				"dbName": "BOR_ID",
				"type": "Long",
				"id": true
			},{
				"name": "name",
				"dbName": "BOR_NAME",
				"type": "String",
				"size": 128,
				"required": true
			},{
				"name": "label",
				"dbName": "BOR_LABEL",
				"type": "String",
				"size": 500,
				"required": true
			},{
				"name": "srcEntityName",
				"dbName": "BOR_SRC_BOE_NAME",
				"type": "String",
				"size": 128,
				"required": true
			},{
				"name": "srcPropertyName",
				"dbName": "BOR_SRC_PROP_NAME",
				"type": "String",
				"size": 128,
				"required": true
			},{
				"name": "srcMultiplicity",
				"dbName": "BOR_SRC_MULTIPLICITY",
				"type": "Short",
				"required": true
			},{
				"name": "targetEntityName",
				"dbName": "BOR_TARGET_BOE_NAME",
				"type": "String",
				"size": 128,
				"required": true
			},{
				"name": "targetPropertyName",
				"dbName": "BOR_TARGET_PROP_NAME",
				"type": "String",
				"size": 128,
				"required": true
			},{
				"name": "targetMultiplicity",
				"dbName": "BOR_TARGET_MULTIPLICITY",
				"type": "Short",
				"required": true
			},{
				"name": "type",
				"dbName": "BOR_TYPE",
				"type": "Short",
				"required": true
			},{
				"name": "joinEntityName",
				"dbName": "BOR_JOIN_ENTITY_NAME",
				"type": "String",
				"size": 128 
			},{
				"name": "joinEntitySrcPropertyName",
				"dbName": "BOR_JOIN_ENTITY_SRC_PROP_NAME",
				"type": "String",
				"size": 128
			},{
				"name": "joinEntityTargetPropertyName",
				"dbName": "BOR_JOIN_ENTITY_TARGET_PROP_NAME",
				"type": "String",
				"size": 128
			}]
		}, "BIZ_RelationDAO");
	dao.listJoins = listJoins;
	return dao;
};
