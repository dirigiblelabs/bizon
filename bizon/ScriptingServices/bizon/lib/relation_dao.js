/* globals $ */
/* eslint-env node, dirigible */
"use strict";

var listJoins = function(settings, daos){
	var joinKey = 'srcEntityName';
	var joinId;
	if(typeof settings === 'string'){
		joinId = settings;
	} else if(typeof settings === 'object'){
		joinId = settings[joinKey];
	}
	this.$log.info('Finding '+daos.n.orm.dbName+' entities related to '+daos.m.orm.dbName+'['+joinId+']');

	if(joinId === undefined || joinId === null){
		throw new Error('Illegal argument for id parameter:' + joinId);
	}

    var connection = this.datasource.getConnection();
    try {

		var statements = require('daoism/statements').get();
		var stmnt = statements.builder()
						.select()
						.from(daos.n.orm.dbName)
						.left_join( daos.join.orm.dbName, undefined, daos.join.orm.getProperty("targetEntityName").dbName+'='+daos.n.orm.getProperty('name').dbName)
						.where(daos.join.orm.getProperty(joinKey).dbName+"=?", [daos.join.orm.getProperty(joinKey)]);
		
		var resultSet = statements.execute(stmnt, connection, settings);
		var entities = [];
        while (resultSet.next()) {
        	var entity = daos.m.createEntity(resultSet);
        	entities.push(entity);
        }
        this.$log.info(entities.length+' '+daos.n.orm.dbName+' entities related to '+daos.m.orm.dbName+'[' + joinKey+ '] found');
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
				"name": "srcEntityName",
				"dbName": "BOR_SRC_BOH_NAME",
				"type": "String",
				"size": 100,
				"required": true
			},{
				"name": "srcMultiplicity",
				"dbName": "BOR_SRC_TYPE",
				"type": "Short",
				"required": true
			},{
				"name": "targetEntityName",
				"dbName": "BOR_TARGET_BOH_NAME",
				"type": "String",
				"size": 100,
				"required": true
			},{
				"name": "targetMultiplicity",
				"dbName": "BOR_TARGET_TYPE",
				"type": "Short",
				"required": true
			},{
				"name": "name",
				"dbName": "BOR_NAME",
				"type": "String",
				"size": 200,
				"required": true
			},{
				"name": "type",
				"dbName": "BOR_TYPE",
				"type": "Short",
				"required": true
			}]
		}, "BIZ_RelationDAO");
	dao.listJoins = listJoins;
	return dao;
};
