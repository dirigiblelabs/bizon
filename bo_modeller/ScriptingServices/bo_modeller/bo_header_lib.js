/* globals $ */
/* eslint-env node, dirigible */

var request = require("net/http/request");
var response = require("net/http/response");
var database = require("db/database");
var boItemLib = require("bo_modeller/bo_item_lib");

var datasource = database.getDatasource();

// create entity by parsing JSON object from request body
exports.createBo_header = function() {
    var input = request.readInputText();
    var header = JSON.parse(input);
    var connection = datasource.getConnection();
    try {
        var sql = "INSERT INTO BO_HEADER (";
        sql += "BOH_ID";
        sql += ",";
        sql += "BOH_NAME";
        sql += ",";
        sql += "BOH_TABLE";
        sql += ",";
        sql += "BOH_DESCRIPTION";
        sql += ") VALUES ("; 
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
        var id = datasource.getSequence('BO_HEADER_BOH_ID').next();
        statement.setInt(++i, id);
        statement.setString(++i, header.boh_name);
        statement.setString(++i, header.boh_table);
        statement.setString(++i, header.boh_description);
        statement.executeUpdate();
        
        if(header.properties && header.properties.length>0){
        	for(var j=0; j<header.properties.length; j++){
        		var property = header.properties[j];
				boItemLib.createBo_items(property, false);
    		}
    	}

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
exports.readBo_headerEntity = function(id, expanded) {
    var connection = datasource.getConnection();
    try {
        var header;
        var sql = "SELECT * FROM BO_HEADER WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setInt(1, id);
        
        var resultSet = statement.executeQuery();
        if (resultSet.next()) {
            header = createEntity(resultSet);
        } else {
        	exports.printError(response.NOT_FOUND, 1, "Record with id: " + id + " does not exist.", sql);
        }

		if(expanded){
		   var properties = boItemLib.readBo_itemsEntity(header.id);
		   if(properties){
		   	 header.properties = properties;
	   	   }
		}
        
        var jsonResponse = JSON.stringify(header, null, 2);
        response.println(jsonResponse);
    } catch(e){
        var errorCode = response.BAD_REQUEST;
        exports.printError(errorCode, errorCode, e.message, sql);
    } finally {
        connection.close();
    }
};

// read all entities and print them as JSON array to response
exports.readBo_headerList = function(limit, offset, sort, desc, expanded) {
    var connection = datasource.getConnection();
    try {
        var headers = [];
        var sql = "SELECT ";
        if (limit !== null && offset !== null) {
            sql += " " + datasource.getPaging().genTopAndStart(limit, offset);
        }
        sql += " * FROM BO_HEADER";
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
        	var header = createEntity(resultSet);
        	if(expanded){
			   var properties = boItemLib.readBo_itemsEntity(header.id);
			   if(properties){
			   	 header.properties = properties;
		   	   }
			}
            headers.push(header);
        }
        var jsonResponse = JSON.stringify(headers, null, 2);
        response.println(jsonResponse);
    } catch(e){
        var errorCode = response.BAD_REQUEST;
        exports.printError(errorCode, errorCode, e.message, sql);
    } finally {
        connection.close();
    }
};

//create entity as JSON object from ResultSet current Row
function createEntity(resultSet) {
    var result = {};
	result.boh_id = resultSet.getInt("BOH_ID");
    result.boh_name = resultSet.getString("BOH_NAME");
    result.boh_table = resultSet.getString("BOH_TABLE");
    result.boh_description = resultSet.getString("BOH_DESCRIPTION");
    return result;
}

function convertToDateString(date) {
    var fullYear = date.getFullYear();
    var month = date.getMonth() < 10 ? "0" + date.getMonth() : date.getMonth();
    var dateOfMonth = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    return fullYear + "/" + month + "/" + dateOfMonth;
}

// update Header entity by id, optionally upserting its Items composition
exports.updateBo_header = function(cascaded) {
    var input = request.readInputText();
    var header = JSON.parse(input);
    var connection = datasource.getConnection();
    try {
        var sql = "UPDATE BO_HEADER SET ";
        sql += "BOH_NAME = ?";
        sql += ",";
        sql += "BOH_TABLE = ?";
        sql += ",";
        sql += "BOH_DESCRIPTION = ?";
        sql += " WHERE BOH_ID = ?";
        var statement = connection.prepareStatement(sql);
        var i = 0;
        statement.setString(++i, header.boh_name);
        statement.setString(++i, header.boh_table);
        statement.setString(++i, header.boh_description);
        var id = header.boh_id;
        statement.setInt(++i, id);
        statement.executeUpdate();
        
        if(cascaded){
        	if(header.properties){
        		for(var j=0; j<header.properties.length;j++){
        			var item = header.properties[j];
        			if(item.id){
        				boItemLib.updateBo_items(item, false);
        			} else {
        				boItemLib.createBo_items(item, false);
        			}
        		}	
        	}
        }
        
		response.println(id);
    } catch(e){
        var errorCode = response.BAD_REQUEST;
        exports.printError(errorCode, errorCode, e.message, sql);
    } finally {
        connection.close();
    }
};

// delete entity
exports.deleteBo_header = function(id, cascaded) {
    var connection = datasource.getConnection();
    try {
    	var sql = "DELETE FROM BO_HEADER WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setString(1, id);
        statement.executeUpdate();
        
        if(cascaded){
	       	var properties = boItemLib.readBo_itemsEntity(id);
	       	if(properties){
	       		for(var i=0;i<properties.length;i++){
	       			boItemLib.deleteBo_items(properties[i].id);
	   			}
	   		}    	
    	}
        response.println(id);
    } catch(e){
        var errorCode = response.BAD_REQUEST;
        exports.printError(errorCode, errorCode, e.message, sql);
    } finally {
        connection.close();
    }
};

exports.countBo_header = function() {
    var count = 0;
    var connection = datasource.getConnection();
    try {
    	var sql = 'SELECT COUNT(*) FROM BO_HEADER';
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

exports.metadataBo_header = function() {
	var entityMetadata = {
		name: 'bo_header',
		type: 'object',
		properties: []
	};
	
	var propertyboh_id = {
		name: 'boh_id',
		type: 'integer',
	key: 'true',
	required: 'true'
	};
    entityMetadata.properties.push(propertyboh_id);

	var propertyboh_name = {
		name: 'boh_name',
		type: 'string'
	};
    entityMetadata.properties.push(propertyboh_name);

	var propertyboh_table = {
		name: 'boh_table',
		type: 'string'
	};
    entityMetadata.properties.push(propertyboh_table);

	var propertyboh_description = {
		name: 'boh_description',
		type: 'string'
	};
    entityMetadata.properties.push(propertyboh_description);


	response.println(JSON.stringify(entityMetadata));
};

exports.getPrimaryKeys = function() {
    var result = [];
    var i = 0;
    result[i++] = 'BOH_ID';
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
