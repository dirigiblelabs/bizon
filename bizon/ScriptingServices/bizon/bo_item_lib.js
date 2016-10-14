/* globals $ */
/* eslint-env node, dirigible */

var request = require("net/http/request");
var response = require("net/http/response");
var database = require("db/database");

var datasource = database.getDatasource();

var persistentProperties = {
	mandatory: ["boi_id", "boi_boh_id", "boi_name","boi_column","boi_type"],
	optional: ["boi_length", "boi_null", "boi_pk", "boi_default"]
};

// Parse JSON entity into SQL and insert in db. Returns the new record id.
exports.insert = function(item) {
	
	console.log('Inserting BO_ITEM entity ' + item);
	
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
        var sql = "INSERT INTO BO_ITEM (";
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
        
        item.boi_id = datasource.getSequence('BO_ITEM_BOI_ID').next();
        
        var j = 0;
        statement.setInt(++j, item.boi_id);
        statement.setInt(++j, item.boi_boh_id);
        statement.setString(++j, item.boi_name);
        statement.setString(++j, item.boi_column);
        statement.setInt(++j, item.boi_type);
        statement.setInt(++j, item.boi_length);
        statement.setShort(++j, item.boi_null);
        statement.setShort(++j, item.boi_pk);
        statement.setString(++j, item.boi_default);
        statement.executeUpdate();
        
        console.log('BO_ITEM entity inserted with boi_id[' + item.boi_id + ']');
        
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

	console.log('Finding BO_ITEM entity with id ' + id);

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
            	console.log('BO_ITEM entity with id[' + id + '] found');
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

	console.log('Listing BO_ITEM entity collection for header id ' + headerId + ' with list operators: limit['+limit+'], offset['+offset+'], sort['+sort+'], order['+order+']');

    var connection = datasource.getConnection();
    try {
        var items = [];
        var sql = "SELECT ";
        if ((limit !== null && limit !== undefined) && (offset !== null && offset !== undefined)) {
            sql += " " + datasource.getPaging().genTopAndStart(limit, offset);
        }
        sql += " * FROM BO_ITEM";
        if(headerId !== null && headerId !== undefined){
        	sql += " WHERE BOI_BOH_ID=" + headerId;
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
        
        console.log('' + items.length +' BO_ITEM entities found');
        
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
	entity.boi_boh_id = resultSet.getInt("BOI_BOH_ID");
    entity.boi_name = resultSet.getString("BOI_NAME");
    entity.boi_column = resultSet.getString("BOI_COLUMN");
	entity.boi_type = resultSet.getInt("BOI_TYPE");
	entity.boi_type = codeToStringItemTypeMapping(entity.boi_type);
	entity.boi_length = resultSet.getInt("BOI_LENGTH");
    if(entity.boi_length === null)
    	delete entity.boi_length;	
    entity.boi_null = resultSet.getShort("BOI_NULL");
    if(entity.boi_null === 0){
    	entity.boi_null = false;
	} else {
		entity.boi_null = true;
	}
    entity.boi_pk = resultSet.getShort("BOI_PK");
    if(entity.boi_pk === 0){
    	entity.boi_pk = false;
	} else {
		entity.boi_pk = true;
	}
    entity.boi_default = resultSet.getString("BOI_DEFAULT");
    if(entity.boi_default === null)
    	delete entity.boi_default;	    
    console.log("Transformation from DB JSON object finished: " + entity);
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
	persistentItem.boi_type = stringToCodeItemTypeMapping(persistentItem.boi_type);
	if(persistentItem.boi_null === null || persistentItem.boi_null === true){
		persistentItem.boi_null = 1;
	} else {
   	   	persistentItem.boi_null = 0;
    }
	if(persistentItem.boi_pk === null || persistentItem.boi_pk === false){
		persistentItem.boi_pk = 0;
	} else {
	   	persistentItem.boi_pk = 1;	
	}
	if(persistentItem.boi_length === null){
		persistentItem.boi_length = 0;
	}
	console.log("Transformation to DB JSON object finished: " + persistentItem);
	return persistentItem;
}

function convertToDateString(date) {
    var fullYear = date.getFullYear();
    var month = date.getMonth() < 10 ? "0" + date.getMonth() : date.getMonth();
    var dateOfMonth = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    return fullYear + "/" + month + "/" + dateOfMonth;
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

	console.log('Updating BO_ITEM entity ' + item);

	if(item === undefined || item === null){
		throw new Error('Illegal argument: item is ' + item);
	}
	
	if(item.boi_id === undefined || item.boi_id === null){
		throw new Error('Illegal boi_id attribute: ' + item.boi_id);
	}	
	
	if(item.boi_boh_id === undefined || item.boi_boh_id === null){
		throw new Error('Illegal boi_boh_id attribute: ' + item.boi_boh_id);
	}	
	
	if(item.boi_name === undefined || item.boi_name === null){
		throw new Error('Illegal boi_name attribute: ' + item.boi_name);
	}

	if(item.boi_type === undefined || item.boi_type === null){
		throw new Error('Illegal boi_type attribute: ' + item.boi_type);
	}

    var connection = datasource.getConnection();
    try {
        var sql = "UPDATE BO_ITEM SET ";
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
        
        console.log('BO_ITEM entity with boi_id[' + id + '] updated');
        
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

	console.log('Deleting BO_ITEM entity with id[' + id + ']');
	
	if(id === undefined || id === null){
		throw new Error('Illegal argument: id[' + id + ']');
	}	

    var connection = datasource.getConnection();
    try {
    	var sql = "DELETE FROM BO_ITEM WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setString(1, id);
        statement.executeUpdate();
        
        console.log('BO_ITEM entity with boi_id[' + id + '] deleted');        
        
        return this;
        
    }  catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};


exports.count = function() {

	console.log('Counting BO_ITEM entities');

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
    
    console.log('' + count + ' BO_ITEMS entities counted');         
    
    return count;
};

exports.metadata = function() {

	console.log('Exporting metadata for BO_ITEM type');

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

	idPropertyName: 'boi_id',
	validSortPropertyNames: ['boi_id','boi_name','boi_boh_id','boi_column','boi_type','boi_length','boi_null','boi_default'],

	dispatch: function(urlParameters){
		var method = request.getMethod().toUpperCase();
		console.log('Dispatching operation request for HTTP Verb['+ method +'] and URL parameters: ' + urlParameters);

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
					this.query(urlParameters.list.headerId, urlParameters.list.limit, urlParameters.list.offset, urlParameters.list.sort, urlParameters.list.order);
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
			item[this.idPropertyName] = exports.insert(item);
			response.setStatus(response.OK);
			response.setHeader('Location', $.getRequest().getRequestURL().toString() + '/' + item[this.idPropertyName]);
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
			item[this.idPropertyName] = exports.update(item);
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
	
	query: function(headerId, limit, offset, sort, order){
		if (headerId === undefined) {
			headerId = null;
		}
		if (offset === undefined || offset === null) {
			offset = 0;
		} else if(isNaN(parseInt(offset)) || offset<0) {
			this.printError(response.BAD_REQUEST, 1, "Invallid offset parameter: " + offset + ". Must be a positive integer.");
			return;
		}

		if (limit === undefined || limit === null) {
			limit = 0;
		}  else if(isNaN(parseInt(limit)) || limit<0) {
			this.printError(response.BAD_REQUEST, 1, "Invallid limit parameter: " + limit + ". Must be a positive integer.");
			return;			
		}
		if (sort === undefined) {
			sort = null;
		} else if( sort !== null && this.validSortPropertyNames.indexOf(sort)<0){
			this.printError(response.BAD_REQUEST, 1, "Invalid sort by property name: " + sort);
			return;
		}
		if (order === undefined) {
			order = null;
		} else if(order!==null){
			if(sort === null){
				this.printError(response.BAD_REQUEST, 1, "Parameter order is invalid without paramter sort to order by.");
				return;
			} else if(['asc', 'desc'].indexOf(order.trim().toLowerCase())){
				this.printError(response.BAD_REQUEST, 1, "Invallid order parameter: " + order + ". Must be either ASC or DESC.");
				return;
			}
		}
	    try{
			var items = exports.list(headerId, limit, offset, sort, order);
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
