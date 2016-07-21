/* globals $ */
/* eslint-env node, dirigible */

var request = require("net/http/request");
var response = require("net/http/response");
var database = require("db/database");

var datasource = database.getDatasource();

// create entity by parsing JSON object from request body
exports.createBo_items = function(item) {
	if(!item){	
	    var input = request.readInputText();
	    item = JSON.parse(input);
	}
    var connection = datasource.getConnection();
    try {
        var sql = "INSERT INTO BO_ITEMS (";
        sql += "BOI_ID";
        sql += ",";
        sql += "BOI_BOH_ID";
        sql += ",";
        sql += "BOI_NAME";
        sql += ",";
        sql += "BOI_COLUMN";
        sql += ",";
        sql += "BOI_TYPE";
        sql += ",";
        sql += "BOI_LENGTH";
        sql += ",";
        sql += "BOI_NULL";
        sql += ",";
        sql += "BOI_PK";
        sql += ",";
        sql += "BOI_DEFAULT";
        sql += ") VALUES ("; 
        sql += "?";
        sql += ",";
        sql += "?";
        sql += ",";
        sql += "?";
        sql += ",";
        sql += "?";
        sql += ",";
        sql += "?";
        sql += ",";
        sql += "?";
        sql += ",";
        sql += "?";
        sql += ",";
        sql += "?";
        sql += ",";
        sql += "?";
        sql += ")";

        var statement = connection.prepareStatement(sql);
        var i = 0;
        var id = datasource.getSequence('BO_ITEMS_BOI_ID').next();
        statement.setInt(++i, id);
        statement.setInt(++i, item.boi_boh_id);
        statement.setString(++i, item.boi_name);
        statement.setString(++i, item.boi_column);
        statement.setInt(++i, item.boi_type);
        statement.setInt(++i, item.boi_length);
        statement.setShort(++i, item.boi_null);
        statement.setShort(++i, item.boi_pk);
        statement.setString(++i, item.boi_default);
        statement.executeUpdate();
		response.println(id);
        return id;
    } catch(e) {
        var errorCode = response.BAD_REQUEST;
        exports.printError(errorCode, errorCode, e.message, sql);
    } finally {
        connection.close();
    }
    return -1;
};

// read single entity by id and print as JSON object to response
exports.readBo_itemsEntity = function(id) {
    var connection = datasource.getConnection();
    try {
        var result;
        var sql = "SELECT * FROM BO_ITEMS WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setInt(1, id);
        
        var resultSet = statement.executeQuery();
        if (resultSet.next()) {
            result = createEntity(resultSet);
        } else {
        	exports.printError(response.NOT_FOUND, 1, "Record with id: " + id + " does not exist.", sql);
        }
        var jsonResponse = JSON.stringify(result, null, 2);
        response.println(jsonResponse);
    } catch(e){
        var errorCode = response.BAD_REQUEST;
        exports.printError(errorCode, errorCode, e.message, sql);
    } finally {
        connection.close();
    }
};

// read all entities and print them as JSON array to response
exports.readBo_itemsList = function(limit, offset, sort, desc) {
    var connection = datasource.getConnection();
    try {
        var result = [];
        var sql = "SELECT ";
        if (limit !== null && offset !== null) {
            sql += " " + datasource.getPaging().genTopAndStart(limit, offset);
        }
        sql += " * FROM BO_ITEMS";
        if (sort !== null) {
            sql += " ORDER BY " + sort;
        }
        if (sort !== null && desc !== null) {
            sql += " DESC ";
        }
        if (limit !== null && offset !== null) {
            sql += " " + datasource.getPaging().genLimitAndOffset(limit, offset);
        }
        var statement = connection.prepareStatement(sql);
        var resultSet = statement.executeQuery();
        while (resultSet.next()) {
            result.push(createEntity(resultSet));
        }
        var jsonResponse = JSON.stringify(result, null, 2);
        response.println(jsonResponse);
    } catch(e){
        var errorCode = response.BAD_REQUEST;
        exports.printError(errorCode, errorCode, e.message, sql);
    } finally {
        connection.close();
    }
};

// read all entities for a header with given id and returns them as JSON array
exports.readHeaderBo_itemsList = function(headerId, limit, offset, sort, desc) {
    var connection = datasource.getConnection();
    try {
        var result = [];
        var sql = "SELECT ";
        if (limit !== null && offset !== null) {
            sql += " " + datasource.getPaging().genTopAndStart(limit, offset);
        }
        sql += " * FROM BO_ITEMS";
        sql += " WHERE BOI_BOH_ID=" + headerId;
        if (sort !== null) {
            sql += " ORDER BY " + sort;
        }
        if (sort !== null && desc !== null) {
            sql += " DESC ";
        }
        if (limit !== null && offset !== null) {
            sql += " " + datasource.getPaging().genLimitAndOffset(limit, offset);
        }
        var statement = connection.prepareStatement(sql);
        var resultSet = statement.executeQuery();
        while (resultSet.next()) {
            result.push(createEntity(resultSet));
        }
		return JSON.stringify(result, null, 2);
    } finally {
        connection.close();
    }
};

//create entity as JSON object from ResultSet current Row
function createEntity(resultSet) {
    var result = {};
	result.boi_id = resultSet.getInt("BOI_ID");
	result.boi_boh_id = resultSet.getInt("BOI_BOH_ID");
    result.boi_name = resultSet.getString("BOI_NAME");
    result.boi_column = resultSet.getString("BOI_COLUMN");
	result.boi_type = resultSet.getInt("BOI_TYPE");
	result.boi_length = resultSet.getInt("BOI_LENGTH");
    result.boi_null = resultSet.getShort("BOI_NULL");
    result.boi_pk = resultSet.getShort("BOI_PK");
    result.boi_default = resultSet.getString("BOI_DEFAULT");
    return result;
}

function convertToDateString(date) {
    var fullYear = date.getFullYear();
    var month = date.getMonth() < 10 ? "0" + date.getMonth() : date.getMonth();
    var dateOfMonth = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    return fullYear + "/" + month + "/" + dateOfMonth;
}

// update entity by id
exports.updateBo_items = function(item) {
	if(!item){
	    var input = request.readInputText();
	    item = JSON.parse(input);		
	}

    var connection = datasource.getConnection();
    try {
        var sql = "UPDATE BO_ITEMS SET ";
        sql += "BOI_BOH_ID = ?";
        sql += ",";
        sql += "BOI_NAME = ?";
        sql += ",";
        sql += "BOI_COLUMN = ?";
        sql += ",";
        sql += "BOI_TYPE = ?";
        sql += ",";
        sql += "BOI_LENGTH = ?";
        sql += ",";
        sql += "BOI_NULL = ?";
        sql += ",";
        sql += "BOI_PK = ?";
        sql += ",";
        sql += "BOI_DEFAULT = ?";
        sql += " WHERE BOI_ID = ?";
        var statement = connection.prepareStatement(sql);
        var i = 0;
        statement.setInt(++i, item.boi_boh_id);
        statement.setString(++i, item.boi_name);
        statement.setString(++i, item.boi_column);
        statement.setInt(++i, item.boi_type);
        statement.setInt(++i, item.boi_length);
        statement.setShort(++i, item.boi_null);
        statement.setShort(++i, item.boi_pk);
        statement.setString(++i, item.boi_default);
        var id = item.boi_id;
        statement.setInt(++i, id);
        statement.executeUpdate();
		response.println(id);
    } catch(e){
        var errorCode = response.BAD_REQUEST;
        exports.printError(errorCode, errorCode, e.message, sql);
    } finally {
        connection.close();
    }
};

// delete entity
exports.deleteBo_items = function(id, printResultInResponse) {
    var connection = datasource.getConnection();
    try {
    	var sql = "DELETE FROM BO_ITEMS WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setString(1, id);
        statement.executeUpdate();
        if(printResultInResponse)
        	response.println(id);
        return id;
    } catch(e){
        var errorCode = response.BAD_REQUEST;
        exports.printError(errorCode, errorCode, e.message, sql);
    } finally {
        connection.close();
    }
};


exports.countBo_items = function() {
    var count = 0;
    var connection = datasource.getConnection();
    try {
    	var sql = 'SELECT COUNT(*) FROM BO_ITEMS';
        var statement = connection.prepareStatement(sql);
        var rs = statement.executeQuery();
        if (rs.next()) {
            count = rs.getInt(1);
        }
    } catch(e){
        var errorCode = response.BAD_REQUEST;
        exports.printError(errorCode, errorCode, e.message, sql);
    } finally {
        connection.close();
    }
    response.println(count);
};

exports.metadataBo_items = function() {
	var entityMetadata = {
		name: 'bo_items',
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

	var propertyboi_boh_id = {
		name: 'boi_boh_id',
		type: 'integer'
	};
    entityMetadata.properties.push(propertyboi_boh_id);

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

	var propertyboi_pk = {
		name: 'boi_pk',
		type: 'smallint'
	};
    entityMetadata.properties.push(propertyboi_pk);

	var propertyboi_default = {
		name: 'boi_default',
		type: 'string'
	};
    entityMetadata.properties.push(propertyboi_default);


	response.println(JSON.stringify(entityMetadata));
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

exports.hasConflictingParameters = function(id, count, metadata) {
    if(id !== null && count !== null){
    	exports.printError(response.EXPECTATION_FAILED, 1, "Expectation failed: conflicting parameters - id, count");
        return true;
    }
    if(id !== null && metadata !== null){
    	exports.printError(response.EXPECTATION_FAILED, 2, "Expectation failed: conflicting parameters - id, metadata");
        return true;
    }
    return false;
};

// check whether the parameter exists 
exports.isInputParameterValid = function(paramName) {
    var param = request.getParameter(paramName);
    if(param === null || param === undefined){
    	exports.printError(response.PRECONDITION_FAILED, 3, "Expected parameter is missing: " + paramName);
        return false;
    }
    return true;
};

// print error
exports.printError = function(httpCode, errCode, errMessage, errContext) {
    var body = {'err': {'code': errCode, 'message': errMessage}};
    response.setStatus(httpCode);
    response.setHeader("Content-Type", "application/json");
    response.print(JSON.stringify(body));
    console.error(JSON.stringify(body));
    if (errContext !== null) {
    	console.error(JSON.stringify(errContext));
    }
};
