/* globals $ */
/* eslint-env node, dirigible */

var request = require("net/http/request");
var response = require("net/http/response");
var database = require("db/database");

var datasource = database.getDatasource();

// read all entities and print them as JSON array to response
exports.readBo_flat_viewList = function(limit, offset, sort, desc) {
    var connection = datasource.getConnection();
    try {
        var result = [];
        var sql = "SELECT ";
        if (limit !== null && offset !== null) {
            sql += " " + datasource.getPaging().genTopAndStart(limit, offset);
        }
        sql += " * FROM BO_FLAT_VIEW";
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
        exports.printError(errorCode, errorCode, e.message);
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


exports.countBo_flat_view = function() {
    var count = 0;
    var connection = datasource.getConnection();
    try {
    	var sql = 'SELECT COUNT(*) FROM BO_FLAT_VIEW';
        var statement = connection.prepareStatement(sql);
        var rs = statement.executeQuery();
        if (rs.next()) {
            count = rs.getInt(1);
        }
    } catch(e){
        var errorCode = response.BAD_REQUEST;
        exports.printError(errorCode, errorCode, e.message);
    } finally {
        connection.close();
    }
    response.println(count);
};

exports.metadataBo_flat_view = function() {
	var entityMetadata = {
		name: 'bo_flat_view',
		type: 'object',
		properties: []
	};
	
	var propertyboh_id = {
		name: 'boh_id',
		type: 'integer'
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

	var propertyboi_id = {
		name: 'boi_id',
		type: 'integer'
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

exports.hasConflictingParameters = function(id, count, metadata) {
    if(id !== null && count !== null){
    	printError(response.EXPECTATION_FAILED, 1, "Expectation failed: conflicting parameters - id, count");
        return true;
    }
    if(id !== null && metadata !== null){
    	printError(response.EXPECTATION_FAILED, 2, "Expectation failed: conflicting parameters - id, metadata");
        return true;
    }
    return false;
}

// check whether the parameter exists 
exports.isInputParameterValid = function(paramName) {
    var param = request.getParameter(paramName);
    if(param === null || param === undefined){
    	printError(response.PRECONDITION_FAILED, 3, "Expected parameter is missing: " + paramName);
        return false;
    }
    return true;
}

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
}

