/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

var database = require("db/database");

var datasource = database.getDatasource();

var persistentProperties = {
	mandatory: ["boi_id", "boi_boh_name", "boi_name", "boi_column", "boi_type", "boi_type_name"],
	optional: ["boi_length", "boi_null", "boi_default"]
};

var $log = require("bizon/lib/logger").logger;
$log.ctx = "Item DAO";

// Parse JSON entity into SQL and insert in db. Returns the new record id.
exports.insert = function(item) {
	
	$log.info('Inserting BO_ITEM entity');
	
	if(item === undefined || item === null){
		throw new Error('Illegal argument: item is ' + item);
	}
	
	for(var i = 0; i< persistentProperties.mandatory.length; i++){
		var propName = persistentProperties.mandatory[i];
		if(propName==='boi_id')
			continue;//Skip validaiton check for id. It's epxected to be null on insert.
		var propValue = item[propName];
		if(propValue === undefined || propValue === null){
			throw new Error('Illegal ' + propName + ' attribute value: ' + propValue);
		}
	}
	
    var connection = datasource.getConnection();
    try {
        var sql = "INSERT INTO BO_ITEM (BOI_ID, BOI_BOH_NAME, BOI_NAME, BOI_COLUMN, BOI_TYPE_NAME, BOI_TYPE, BOI_LENGTH, BOI_NULL, BOI_DEFAULT)";
        sql += " VALUES (?,?,?,?,?,?,?,?,?)";

        var statement = connection.prepareStatement(sql);
        item = createSQLEntity(item);
        
        item.boi_id = datasource.getSequence('BO_ITEM_BOI_ID').next();
        
        var j = 0;
        statement.setInt(++j, item.boi_id);
        statement.setString(++j, item.boi_boh_name);
        statement.setString(++j, item.boi_name);
        statement.setString(++j, item.boi_column);
        statement.setString(++j, item.boi_type_name);        
        statement.setString(++j, item.boi_type);
        statement.setInt(++j, item.boi_length);
        statement.setShort(++j, item.boi_null);
        statement.setString(++j, item.boi_default);
        statement.executeUpdate();
        
        $log.info('BO_ITEM entity inserted with boi_id[' + item.boi_id + ']');
        
        return item.boi_id;
        
    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

// Reads a single entity by id, parsed into JSON object 
exports.find = function(id) {

	$log.info('Finding BO_ITEM entity with id[' + id + ']');

    var connection = datasource.getConnection();
    try {
        var item;
        var sql = "SELECT * FROM BO_ITEM WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setInt(1, id);
        
        var resultSet = statement.executeQuery();
        if (resultSet.next()) {
            item = createEntity(resultSet);
            if(item)
            	$log.info('BO_ITEM entity with id[' + id + '] found');
        }
        
        return item;

    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

// Read all entities, parse and return them as an array of JSON objets
exports.list = function(headerId, limit, offset, sort, order) {

	$log.info('Listing BO_ITEM entity collection for header ' + headerId + ' with list operators: limit['+limit+'], offset['+offset+'], sort['+sort+'], order['+order+']');

    var connection = datasource.getConnection();
    try {
        var items = [];
        var sql = "SELECT ";
        if ((limit !== null && limit !== undefined) && (offset !== null && offset !== undefined)) {
            sql += " " + datasource.getPaging().genTopAndStart(limit, offset);
        }
        sql += " * FROM BO_ITEM";
        if(headerId !== null && headerId !== undefined){
        	sql += " WHERE BOI_BOH_NAME='" + headerId+"'";
        }
        if (sort !== null && sort !== undefined) {
            sql += " ORDER BY " + sort;
        }
        if ((sort !== null && sort !== undefined) && (order !== null && order !== undefined)) {
            sql += " " + order;
        }
        if ((limit !== null && limit !== undefined) && (offset !== null && offset !== undefined)) {
            sql += " " + datasource.getPaging().genLimitAndOffset(limit, offset);
        }

        var statement = connection.prepareStatement(sql);
        var resultSet = statement.executeQuery();
        while (resultSet.next()) {
            items.push(createEntity(resultSet));
        }
        
        $log.info('' + items.length +' BO_ITEM entities found');
        
        return items;
        
    }  catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

//create entity as JSON object from ResultSet current Row
function createEntity(resultSet) {
    var entity = {};
	entity.boi_id = resultSet.getInt("BOI_ID");
	entity.boi_boh_name = resultSet.getString("BOI_BOH_NAME");
    entity.boi_name = resultSet.getString("BOI_NAME");
    entity.boi_column = resultSet.getString("BOI_COLUMN");
	entity.boi_type_name = resultSet.getString("BOI_TYPE_NAME");    
	entity.boi_type = resultSet.getString("BOI_TYPE");
//	entity.boi_type = codeToStringItemTypeMapping(entity.boi_type);
	entity.boi_length = resultSet.getInt("BOI_LENGTH");
    if(entity.boi_length === null)
    	delete entity.boi_length;	
    entity.boi_null = resultSet.getShort("BOI_NULL");
    if(entity.boi_null === 0){
    	entity.boi_null = false;
	} else {
		entity.boi_null = true;
	}
    entity.boi_default = resultSet.getString("BOI_DEFAULT");
    if(entity.boi_default === null)
    	delete entity.boi_default;	    
    $log.info("Transformation from DB JSON object finished");
    return entity;
}

//Prepare a JSON object for insert into DB
function createSQLEntity(item) {
	var persistentItem = {};
	for(var i=0;i<persistentProperties.mandatory.length;i++){
		persistentItem[persistentProperties.mandatory[i]] = item[persistentProperties.mandatory[i]];
	}
	for(var i=0;i<persistentProperties.optional.length;i++){
		if(item[persistentProperties.optional[i]] !== undefined){
			persistentItem[persistentProperties.optional[i]] = item[persistentProperties.optional[i]];
		} else {
			persistentItem[persistentProperties.optional[i]] = null;
		}
	}
//	persistentItem.boi_type = stringToCodeItemTypeMapping(persistentItem.boi_type);
	if(persistentItem.boi_null === null || persistentItem.boi_null === true){
		persistentItem.boi_null = 1;
	} else {
   	   	persistentItem.boi_null = 0;
    }
	if(persistentItem.boi_length === null){
		persistentItem.boi_length = 0;
	}
	$log.info("Transformation to DB JSON object finished");
	return persistentItem;
}

function stringToCodeItemTypeMapping(typeIndex) {
	if(!isNaN(parseInt(typeIndex))){
		return typeIndex;
	}
	if(typeIndex === 'Integer')
		return 1;
	if(typeIndex === 'String')
		return 2;
	if(typeIndex === 'Boolean')
		return 3;
	if(typeIndex === 'Relationship')
		return 1000;
}

function codeToStringItemTypeMapping(code) {
	if(isNaN(parseInt(code))){
		return code;
	}
	if(code === 1)
		return 'Integer';
	if(code === 2)
		return 'String';
	if(code === 3)
		return 'Boolean';
	if(code === 1000)
		return 'Relationship';
}

// update entity from a JSON object. Returns the id of the updated entity.
exports.update = function(item) {

	$log.info('Updating BO_ITEM entity with id[' + item!==undefined?item.boi_id:item + ']');

	if(item === undefined || item === null){
		throw new Error('Illegal argument: item is ' + item);
	}
	
	for(var i = 0; i< persistentProperties.mandatory.length; i++){
		var propName = persistentProperties.mandatory[i];
		var propValue = item[propName];
		if(propValue === undefined || propValue === null){
			throw new Error('Illegal value for property ' + propName + '[' + propValue +'] in BO_ITEM for update ' + item);
		}
	}

    var connection = datasource.getConnection();
    try {
        var sql = "UPDATE BO_ITEM SET BOI_BOH_NAME = ?, BOI_NAME = ?, BOI_COLUMN = ?, BOI_TYPE_NAME = ?, BOI_TYPE = ?, BOI_LENGTH = ?, BOI_NULL = ?, BOI_DEFAULT = ?";
        sql += " WHERE BOI_ID = ?";
        
        var statement = connection.prepareStatement(sql);
        item = createSQLEntity(item);

        var i = 0;
        statement.setString(++i, item.boi_boh_name);
        statement.setString(++i, item.boi_name);
        statement.setString(++i, item.boi_column);
        statement.setString(++i, item.boi_type_name);        
        statement.setString(++i, item.boi_type);
        statement.setInt(++i, item.boi_length);
        statement.setShort(++i, item.boi_null);
        statement.setString(++i, item.boi_default);
        var id = item.boi_id;
        statement.setInt(++i, id);
        statement.executeUpdate();
        
        $log.info('BO_ITEM entity with boi_id[' + id + '] updated');
        
        return this;

    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

// delete entity by id. Returns the id of the deleted entity.
exports.remove = function(id) {

	$log.info('Deleting BO_ITEM entity with id[' + id + ']');
	
	if(id === undefined || id === null){
		throw new Error('Illegal argument: id[' + id + ']');
	}	

    var connection = datasource.getConnection();
    try {
    	var sql = "DELETE FROM BO_ITEM WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setString(1, id);
        statement.executeUpdate();
        
        $log.info('BO_ITEM entity with boi_id[' + id + '] deleted');        
        
        return this;
        
    }  catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};


exports.count = function() {

	$log.info('Counting BO_ITEM entities');

    var count = 0;
    var connection = datasource.getConnection();
    try {
    	var sql = 'SELECT COUNT(*) FROM BO_ITEM';
        var statement = connection.prepareStatement(sql);
        var rs = statement.executeQuery();
        if (rs.next()) {
            count = rs.getInt(1);
        }
    }  catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
    
    $log.info('' + count + ' BO_ITEMS entities counted');         
    
    return count;
};

exports.metadata = function() {

	$log.info('Exporting metadata for BO_ITEM type');

	var entityMetadata = {
		name: 'bo_item',
		type: 'object',
		properties: []
	};
	
	var propertyboi_id = {
		name: 'boi_id',
		type: 'integer',
		key: 'true',
		required: 'true'
	};
    entityMetadata.properties.push(propertyboi_id);

	var propertyboi_boh_name = {
		name: 'boi_boh_name',
		type: 'varchar'
	};
    entityMetadata.properties.push(propertyboi_boh_name);

	var propertyboi_name = {
		name: 'boi_name',
		type: 'string'
	};
    entityMetadata.properties.push(propertyboi_name);

	var propertyboi_column = {
		name: 'boi_column',
		type: 'string'
	};
    entityMetadata.properties.push(propertyboi_column);

	var propertyboi_type_name = {
		name: 'boi_type_name',
		type: 'string'
	};
    entityMetadata.properties.push(propertyboi_type_name);
    
	var propertyboi_type = {
		name: 'boi_type',
		type: 'integer'
	};
    entityMetadata.properties.push(propertyboi_type);

	var propertyboi_length = {
		name: 'boi_length',
		type: 'integer'
	};
    entityMetadata.properties.push(propertyboi_length);

	var propertyboi_null = {
		name: 'boi_null',
		type: 'smallint'
	};
    entityMetadata.properties.push(propertyboi_null);

	var propertyboi_default = {
		name: 'boi_default',
		type: 'string'
	};
    entityMetadata.properties.push(propertyboi_default);

	return JSON.stringify(entityMetadata, null, 2);

};

exports.getPrimaryKeys = function() {
    var result = [];
    var i = 0;
    result[i++] = 'BOI_ID';
    if (result === 0) {
        throw new Error("There is no primary key");
    } else if(result.length > 1) {
        throw new Error("More than one Primary Key is not supported.");
    }
    return result;
};

exports.getPrimaryKey = function() {
	return exports.getPrimaryKeys()[0].toLowerCase();
};

exports.pkToSQL = function() {
    var pks = exports.getPrimaryKeys();
    return pks[0] + " = ?";
};

})();
