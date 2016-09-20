/* globals $ */
/* eslint-env node, dirigible */

var request = require("net/http/request");
var response = require("net/http/response");
var database = require("db/database");

var datasource = database.getDatasource();

// Parse JSON entity into SQL and insert in db. Returns the new record id.
exports.insert = function(item) {

	if(item.boi_type === undefined || item.type === null){
		throw new Error('Invalid type: ' + item.type);
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
        item = createSQLEntity(item);
        
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

        return id;
    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
    return -1;
};

// Reads a single entity by id, parsed into JSON object 
exports.find = function(id) {
    var connection = datasource.getConnection();
    try {
        var item;
        var sql = "SELECT * FROM BO_ITEMS WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setInt(1, id);
        
        var resultSet = statement.executeQuery();
        if (resultSet.next()) {
            item = createEntity(resultSet);
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
exports.list = function(headerId, limit, offset, sort, desc) {
    var connection = datasource.getConnection();
    try {
        var items = [];
        var sql = "SELECT ";
        if (limit !== null && offset !== null) {
            sql += " " + datasource.getPaging().genTopAndStart(limit, offset);
        }
        sql += " * FROM BO_ITEMS";
        if(headerId !== null){
        	sql += " WHERE BOI_BOH_ID=" + headerId;
        }
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
            items.push(createEntity(resultSet));
        }
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
    var result = {};
	result.boi_id = resultSet.getInt("BOI_ID");
	result.boi_boh_id = resultSet.getInt("BOI_BOH_ID");
    result.boi_name = resultSet.getString("BOI_NAME");
    result.boi_column = resultSet.getString("BOI_COLUMN");
	result.boi_type = resultSet.getInt("BOI_TYPE");
	result.boi_type = codeToStringItemTypeMapping(result.boi_type);
	result.boi_length = resultSet.getInt("BOI_LENGTH");
    result.boi_null = resultSet.getShort("BOI_NULL");
    if(result.boi_null === 0){
    	result.boi_null = false;
	} else {
		result.boi_null = true;
	}
    result.boi_pk = resultSet.getShort("BOI_PK");
    if(result.boi_pk === 0){
    	result.boi_pk = false;
	} else {
		result.boi_pk = true;
	}
    result.boi_default = resultSet.getString("BOI_DEFAULT");
    return result;
}

//Prepare a JSON object for insert into DB
function createSQLEntity(item) {
    if(item){
		item.boi_type = stringToCodeItemTypeMapping(item.boi_type);
		console.info("Item type: %s", item.boi_type);
		if(item.boi_null === null || item.boi_null === undefined || item.boi_null === true){
			item.boi_null = 1;
		} else {
    	   	item.boi_null = 0;
	    }
	   	if(item.boi_pk === null || item.boi_pk === undefined || item.boi_pk === false){
			item.boi_pk = 0;
		} else {
	    	item.boi_pk = 1;	
	    }
	  	if(item.boi_default === undefined){
	  		item.boi_default = null;
  		}
	   	console.info("Item pk: %s", item.boi_pk);
	}	
	console.info('<<< ' + item);
	return item;
}

function convertToDateString(date) {
    var fullYear = date.getFullYear();
    var month = date.getMonth() < 10 ? "0" + date.getMonth() : date.getMonth();
    var dateOfMonth = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    return fullYear + "/" + month + "/" + dateOfMonth;
}

function stringToCodeItemTypeMapping(typeName) {
	if(!isNaN(parseInt(typeName))){
		return typeName;
	}
	if(typeName === 'Integer')
		return 1;
	if(typeName === 'String')
		return 2;
	if(typeName === 'Boolean')
		return 3;
	if(typeName === 'Relationship')
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

	if(item.boi_id === undefined || item.boi_id === null){
		throw new Error('Invalid id: ' + item.id);
	}
	if(item.boi_type === undefined || item.type === null){
		throw new Error('Invalid type: ' + item.type);
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
        item = createSQLEntity(item);

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
        return id;
    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

// delete entity by id. Returns the id of the deleted entity.
exports.remove = function(id) {
    var connection = datasource.getConnection();
    try {
    	var sql = "DELETE FROM BO_ITEMS WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setString(1, id);
        statement.executeUpdate();
        return id;
    }  catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};


exports.count = function() {
    var count = 0;
    var connection = datasource.getConnection();
    try {
    	var sql = 'SELECT COUNT(*) FROM BO_ITEMS';
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
    return count;
};

exports.metadata = function() {
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

	return JSON.stringify(entityMetadata);

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

exports.http = {

	dispatch: function(urlParameters){
		var method = request.getMethod().toUpperCase();
		if('POST' === method){
			this.create();
		} else if('PUT' === method){
			this.update();
		} else if('DELETE' === method){
			this.remove(urlParameters.id);
		} else if('GET' === method){
			if(urlParameters){
				if(urlParameters.id){
					this.get(urlParameters.id);
				} else if(urlParameters.metadata){
					this.metadata();
				} else if(urlParameters.count){
					this.count();
				} else if(urlParameters.list){
					this.query(urlParameters.list.headerId, urlParameters.list.limit, urlParameters.list.offset, urlParameters.list.sort, urlParameters.list.desc);
				}
			} else {
				this.query();
			}
		} else {
			this.printError(response.BAD_REQUEST, 4, "Invalid HTTP Method", method);
		}

	}, 

	create: function(){
		var input = request.readInputText();
	    var item = JSON.parse(input);
	    try{
			item.id = exports.insert(item);
			response.setStatus(response.OK);
			response.setHeader('Location', $.getRequest().getRequestURL().toString() + '/' + item.id);
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}
	},
	
	update: function() {
		var input = request.readInputText();
	    var item = JSON.parse(input);
	    try{
			item.id = exports.update(item);
			response.setStatus(response.NO_CONTENT);
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}
	},
	
	remove: function(id) {
	    try{
			exports.remove(id);
			response.setStatus(response.NO_CONTENT);
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}
	},
	
	get: function(id){
		//id is mandatory parameter and an integer
		if(id === undefined || isNaN(parseInt(id))) {
			this.printError(response.BAD_REQUEST, 1, "Invallid id parameter: " + id);
		}

	    try{
			var item = exports.find(id);
			if(!item){
        		this.printError(response.NOT_FOUND, 1, "Record with id: " + id + " does not exist.");
			}
			var jsonResponse = JSON.stringify(item, null, 2);
	        response.println(jsonResponse);        	
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}		
	},
	
	query: function(headerId, limit, offset, sort, desc){
		if (headerId === undefined) {
			headerId = null;
		}
		if (offset === undefined || offset === null) {
			offset = 0;
		} else if(isNaN(parseInt(offset)) || offset<0) {
			this.printError(response.BAD_REQUEST, 1, "Invallid offset parameter: " + offset + ". Must be a positive integer.");
		}

		if (limit === undefined || limit === null) {
			limit = 0;
		}  else if(isNaN(parseInt(limit)) || limit<0) {
			this.printError(response.BAD_REQUEST, 1, "Invallid limit parameter: " + limit + ". Must be a positive integer.");
		}
		if (sort === undefined) {
			sort = null;
		} 
		if (desc === undefined) {
			desc = null;
		} else if(desc!==null){
			if(sort === null){
				this.printError(response.BAD_REQUEST, 1, "Parameter desc is invalid without paramter sort to order by.");
			} else if(desc.toLowerCase()!=='desc' || desc.toLowerCase()!=='asc'){
				this.printError(response.BAD_REQUEST, 1, "Invallid desc parameter: " + desc + ". Must be either ASC or DESC.");
			}
		}
	    try{
			var items = exports.list(headerId, limit, offset, sort, desc);
	        var jsonResponse = JSON.stringify(items, null, 2);
	    	response.println(jsonResponse);      	
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}		
	},
	
	count: function(){
	    try{
			var itemsCount = exports.count();
			response.setHeader("Content-Type", "text/plain");
	    	response.println(itemsCount);      	
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}		
	},
	
	metadata: function(){
 		try{
			var entityMetadata = exports.metadata();
			response.setHeader("Content-Type", "application/json");
			response.println(entityMetadata);
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;        	
		}		
	},
	
	printError: function(httpCode, errCode, errMessage, errContext) {
	    var body = {'err': {'code': errCode, 'message': errMessage}};
	    response.setStatus(httpCode);
	    response.setHeader("Content-Type", "application/json");
	    response.print(JSON.stringify(body));
	    console.error(JSON.stringify(body));
	    if (errContext !== null) {
	    	console.error(JSON.stringify(errContext));
	    }
	}
	
};
