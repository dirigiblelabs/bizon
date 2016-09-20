/* globals $ */
/* eslint-env node, dirigible */

var database = require("db/database");
var boItemLib = require("bo_modeller/bo_item_lib");

/* required for the exports.http module only */
var request = require("net/http/request");
var response = require("net/http/response");

var datasource = database.getDatasource();

var itemsEntitySetName = "items";

// Parse JSON entity into SQL and insert in db. Returns the new record id.
exports.insert = function(entity, cascaded) {

	console.log('Inserting BO_HEADER entity cascaded['+cascaded+'] :' + entity);

	if(entity === undefined || entity === null){
		throw new Error('Illegal argument: entity is ' + entity);
	}

	if(entity.boh_name === undefined || entity.boh_name === null){
		throw new Error('Illegal boh_name attribute: ' + entity.boh_name);
	}

	if(cascaded === undefined || cascaded === null){
		cascaded = false;
	}

    entity = createSQLEntity(entity);

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
        entity.mdh_id = datasource.getSequence('BO_HEADER_BOH_ID').next();
        
        statement.setInt(++i,  entity.boh_id);
        statement.setString(++i, entity.boh_name);
        statement.setString(++i, entity.boh_table);
        statement.setString(++i, entity.boh_description);
        
        statement.executeUpdate();

		if(cascaded){
			if(entity[itemsEntitySetName] && entity[itemsEntitySetName].length > 0){
	        	for(var j=0; j<entity[itemsEntitySetName].length; j++){
	        		var item = entity[itemsEntitySetName][j];
	        		item.boi_boh_id = entity.boh_id;
					boItemLib.insert(item);
	    		}
	    	}
		}

        console.log('BO_HEADER entity inserted with boh_id[' +  entity.boh_id + ']');

        return entity.boh_id;

    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

// Reads a single entity by id, parsed into JSON object 
exports.find = function(id) {

	console.log('Finding BO_HEADER entity with id ' + id);

    var connection = datasource.getConnection();
    try {
        var entity;
        var sql = "SELECT * FROM BO_HEADER WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setInt(1, id);
        
        var resultSet = statement.executeQuery();
        if (resultSet.next()) {
            entity = createEntity(resultSet);
			if(entity)
            	console.log('BO_ITEM entity with id[' + id + '] found');
        } 
        return entity;
    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

// Read all entities, parse and return them as an array of JSON objets
exports.list = function(limit, offset, sort, order, expanded) {

	console.log('Listing BO_HEADER entity collection expanded['+expanded+'] with list operators: limit['+limit+'], offset['+offset+'], sort['+sort+'], order['+order+']');

    var connection = datasource.getConnection();
    try {
        var entities = [];
        var sql = "SELECT ";
        if (limit !== null && offset !== null) {
            sql += " " + datasource.getPaging().genTopAndStart(limit, offset);
        }
        sql += " * FROM BO_HEADER";
        if (sort !== null) {
            sql += " ORDER BY " + sort;
        }
        if (sort !== null && order !== null) {
            sql += " " + order;
        }
        if (limit !== null && offset !== null) {
            sql += " " + datasource.getPaging().genLimitAndOffset(limit, offset);
        }
        var statement = connection.prepareStatement(sql);
        var resultSet = statement.executeQuery();
        while (resultSet.next()) {
        	var entity = createEntity(resultSet);
        	if(expanded !== null && expanded!==undefined){
			   var dependentEntities = mdItems.list(entity.mdh_id, null, null, null, null);
			   if(dependentEntities) {
			   	 entity[itemsEntitySetName] = dependentEntities;
		   	   }
			}
            entities.push(entity);
        }
        
        console.log('' + entities.length +' BO_HEADER entities found');
        
        return entities;
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
	entity.boh_id = resultSet.getInt("BOH_ID");
    result.boh_name = resultSet.getString("BOH_NAME");
    result.boh_table = resultSet.getString("BOH_TABLE");	
	entity.boh_description = resultSet.getString("BOH_DESCRIPTION");
	if(entity.boh_description === null)
		delete entity.boh_description;
    console.log("Transformation from DB JSON object finished: " + entity);    
    return entity;
}

//Prepare a JSON object for insert into DB
function createSQLEntity(entity) {
	if(!entity.mdh_description)
		entity.mdh_description = null;  
	console.log("Transformation to DB JSON object finished: " + entity);
	return entity;
}

function convertToDateString(date) {
    var fullYear = date.getFullYear();
    var month = date.getMonth() < 10 ? "0" + date.getMonth() : date.getMonth();
    var dateOfMonth = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    return fullYear + "/" + month + "/" + dateOfMonth;
}

// update entity from a JSON object. Returns the id of the updated entity.
exports.update = function(entity) {

	console.log('Updating BO_HEADER entity ' + entity);

	if(entity === undefined || entity === null){
		throw new Error('Illegal argument: entity is ' + entity);
	}
	
	if(entity.boh_id === undefined || entity.boh_id === null){
		throw new Error('Illegal boh_id attribute: ' + entity.boh_id);
	}

	if(entity.boh_name === undefined || entity.boh_name === null){
		throw new Error('Illegal boh_name attribute: ' + entity.boh_name);
	}

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
        statement.setString(++i, entity.boh_name);
        statement.setString(++i, entity.boh_table);
        statement.setString(++i, entity.boh_description);
        var id = entity.boh_id;
        statement.setInt(++i, id);
        statement.executeUpdate();
            
        console.log('BO_HEADER entity with boh_id[' + id + '] updated');
        
        return this;
        
    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

// delete entity by id. Returns the id of the deleted entity.
exports.remove = function(id, cascaded) {

	console.log('Deleting BO_HEADER entity with id[' + id + '], cascaded['+cascaded+']');

    var connection = datasource.getConnection();
    try {
    	var sql = "DELETE FROM BO_HEADER WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setString(1, id);
        statement.executeUpdate();
        
		if(cascaded && id){
			var persistedItems = mdItems.list(id);
			for(var i = 0; i < persistedItems.length; i++) {
        		boItemLib.remove(persistedItems[i].mdi_id);
			}
		}        
        
        console.log('BO_HEADER entity with boh_id[' + id + '] deleted');                
        
        return this;

    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

exports.count = function() {

	console.log('Counting BO_HEADER entities');

    var count = 0;
    var connection = datasource.getConnection();
    try {
    	var sql = 'SELECT COUNT(*) FROM BO_HEADER';
        var statement = connection.prepareStatement(sql);
        var rs = statement.executeQuery();
        if (rs.next()) {
            count = rs.getInt(1);
        }
    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
    
    console.log('' + count + ' BO_HEADER entities counted');

    return count;
};

exports.metadata = function() {

	console.log('Exporting metadata for BO_HEADER type');

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

	return JSON.stringify(entityMetadata);
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


exports.http = {

	idPropertyName: 'boh_id',
	validSortPropertyNames: ['boh_id','boh_name','boh_table','boh_description'],

	dispatch: function(urlParameters){
		var method = request.getMethod().toUpperCase();
		console.log('Dispatching operation request for HTTP Verb['+ method +'] and URL parameters: ' + urlParameters);

		if('POST' === method){
			this.create(urlParameters.cascaded);
		} else if('PUT' === method){
			this.update(urlParameters.cascaded);
		} else if('DELETE' === method){
			this.remove(urlParameters.id, urlParameters.cascaded);
		} else if('GET' === method){
			if(urlParameters){
				if(urlParameters.id){
					this.get(urlParameters.id, urlParameters.expanded);
				} else if(urlParameters.metadata){
					this.metadata();
				} else if(urlParameters.count){
					this.count();
				} else if(urlParameters.list){
					this.query(urlParameters.list.limit, urlParameters.list.offset, urlParameters.list.sort, urlParameters.list.order, urlParameters.expanded);
				}
			} else {
				this.query();
			}
		} else {
			this.printError(response.BAD_REQUEST, 4, "Invalid HTTP Method", method);
		}
	}, 

	create: function(cascaded){
		var input = request.readInputText();
	    var item = JSON.parse(input);
	    try{
			item[this.idPropertyName] = exports.insert(item, cascaded);
			response.setStatus(response.OK);
			response.setHeader('Location', $.getRequest().getRequestURL().toString() + '/' + item[this.idPropertyName]);
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}
	},
	
	update: function(cascaded) {
		var input = request.readInputText();
	    var item = JSON.parse(input);
	    try{
			item[this.idPropertyName] = exports.update(item, cascaded);
			response.setStatus(response.NO_CONTENT);
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}
	},
	
	remove: function(id, cascaded) {
	    try{
			exports.remove(id, cascaded);
			response.setStatus(response.NO_CONTENT);
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}
	},
	
	get: function(id, expanded){
		//id is mandatory parameter and an integer
		if(id === undefined || isNaN(parseInt(id))) {
			this.printError(response.BAD_REQUEST, 1, "Invallid id parameter: " + id);
		}

	    try{
			var item = exports.find(id, expanded);
			if(!item){
        		this.printError(response.NOT_FOUND, 1, "Record with id: " + id + " does not exist.");
        		return;
			}
			var jsonResponse = JSON.stringify(item, null, 2);
	        response.println(jsonResponse);        	
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}		
	},
	
	query: function(limit, offset, sort, order, expanded){
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
			var items = exports.list(limit, offset, sort, desc, expanded);
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
/*			response.setHeader("Content-Type", "text/plain");*/			
			response.setHeader("Content-Type", "application/json");//TMP to accommodate the ui which handles only json
/*	    	response.println(itemsCount);      	 */
	    	response.println('{"count":'+itemsCount+'}'); 
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
