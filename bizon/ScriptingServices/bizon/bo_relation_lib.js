/* globals $ */
/* eslint-env node, dirigible */


var database = require("db/database");

/* required for the exports.http module only */
var request = require("net/http/request");
var response = require("net/http/response");

var datasource = database.getDatasource();

var persistentProperties = {
	mandatory: ["bor_id", "bor_src_id", "bor_src_type","bor_target_id","bor_target_type","bor_name","bor_type"],
	optional: []
};

// Parse JSON entity into SQL and insert in db. Returns the new record id.
exports.insert = function(entity) {

	console.log('Inserting BO_RELATION entity[' + entity+"]");

	if(entity === undefined || entity === null){
		throw new Error('Illegal argument: entity is ' + entity);
	}
	
	for(var i = 0; i< persistentProperties.mandatory.length; i++){
		var propName = persistentProperties.mandatory[i];
		if(propName==='bor_id')
			continue;//Skip validaiton check for id. It's epxected to be null on insert.
		var propValue = entity[propName];
		if(propValue === undefined || propValue === null){
			throw new Error('Illegal ' + propName + ' attribute value in BO_RELATON entity for insert: ' + propValue);
		}
	}	

    entity = createSQLEntity(entity);

    var connection = datasource.getConnection();
    try {
        var sql = "INSERT INTO BO_RELATION (";
        sql += "BOR_ID";
        sql += ",";
        sql += "BOR_SRC_ID";
        sql += ",";
        sql += "BOR_SRC_TYPE";
        sql += ",";
        sql += "BOR_TARGET_ID";
        sql += ",";
        sql += "BOR_TARGET_TYPE";
        sql += ",";
        sql += "BOR_NAME";        
        sql += ",";
        sql += "BOR_TYPE";                
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
        sql += ")";
        
        var statement = connection.prepareStatement(sql);
        
        var i = 0;
        entity.bor_id = datasource.getSequence('BO_RELATION_BOR_ID').next();
         
        statement.setInt(++i, entity.bor_id);
        statement.setInt(++i, entity.bor_src_id);
        statement.setShort(++i, entity.bor_src_type);
        statement.setInt(++i, entity.bor_target_id);
        statement.setShort(++i, entity.bor_target_type);
        statement.setString(++i, entity.bor_name);
        statement.setShort(++i, entity.bor_type);
        
        statement.executeUpdate();

        console.log('BO_RELATON entity inserted with bor_id[' +  entity.bor_id + ']');

        return entity.bor_id;

    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

// Reads a single entity by id, parsed into JSON object 
exports.find = function(id) {

	console.log('Finding BO_RELATION entity with id[' + id + "]");

	if(id === undefined || id === null){
		throw new Error('Illegal argument for id parameter:' + id);
	}

    var connection = datasource.getConnection();
    try {
        var entity;
        var sql = "SELECT * FROM BO_RELATION WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setInt(1, id);
        
        var resultSet = statement.executeQuery();
        if (resultSet.next()) {
            entity = createEntity(resultSet);
			if(entity)
            	console.log('BO_RELATION entity with id[' + id + '] found');
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
exports.list = function(limit, offset, sort, order, srcId, targetId) {

	console.log('Listing BO_RELATION entity collection with list operators: limit['+limit+'], offset['+offset+'], sort['+sort+'], order['+order+'], srcId['+srcId+'], targetId['+targetId+']');

    var connection = datasource.getConnection();
    try {
        var entities = [];
        var sql = "SELECT";
        if (limit !== null && offset !== null) {
            sql += " " + datasource.getPaging().genTopAndStart(limit, offset);
        }
        sql += " * FROM BO_RELATION";
        if (srcId !== null || targetId !== null) {
        	sql += " WHERE";
        	if(srcId !== null)
        		sql += " BOR_SRC_ID = ?";
        	if(srcId !== null && targetId !== null)
        		sql += " OR ";
			if(targetId !== null)
        		sql += " BOR_TARGET_ID = ?";
    	}
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
        var i=0;
        if(srcId!==null)
        	statement.setInt(++i, srcId);
        if(targetId!==null)        	
        	statement.setInt(++i, targetId);
        
        var resultSet = statement.executeQuery();
        while (resultSet.next()) {
        	var entity = createEntity(resultSet);
            entities.push(entity);
        }
        
        console.info('' + entities.length +' BO_RELATION entities found');
        
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
	entity.bor_id = resultSet.getInt("BOR_ID");
    entity.bor_src_id = resultSet.getInt("BOR_SRC_ID");
    entity.bor_src_type = resultSet.getShort("BOR_SRC_TYPE");    
    entity.bor_target_id = resultSet.getInt("BOR_TARGET_ID");
    entity.bor_target_type = resultSet.getShort("BOR_TARGET_TYPE"); 
    entity.bor_name = resultSet.getString("BOR_NAME");     
    entity.bor_type = resultSet.getShort("BOR_TYPE");         
    console.log("Transformation from DB JSON object finished: " + entity);    
    return entity;
}

//Prepare a JSON object for insert into DB
function createSQLEntity(entity) {
	for(var i in entity){
		if(entity[i] === undefined){
			entity[i] = null;
		}
	}
	console.log("Transformation to DB JSON object finished: " + entity);
	return entity;
}

// update entity from a JSON object. Returns the id of the updated entity.
exports.update = function(entity) {

	console.log('Updating BO_RELATION entity ' + entity);

	if(entity === undefined || entity === null){
		throw new Error('Illegal argument: entity is ' + entity);
	}	
	
	for(var i = 0; i< persistentProperties.mandatory.length; i++){
		var propName = persistentProperties.mandatory[i];
		var propValue = entity[propName];
		if(propValue === undefined || propValue === null){
			throw new Error('Illegal ' + propName + ' attribute value in BO_RELATON entity for insert: ' + propValue);
		}
	}	

    var connection = datasource.getConnection();
    try {
    
        var sql = "UPDATE BO_RELATION SET ";
        sql += "BOR_SRC_ID = ?";
        sql += ",";
        sql += "BOR_SRC_TYPE = ?";
        sql += ",";
        sql += "BOR_TARGET_ID = ?";
        sql += ",";
        sql += "BOR_TARGET_TYPE = ?";
        sql += ",";
        sql += "BOR_NAME = ?";        
        sql += ",";
        sql += "BOR_TYPE = ?";        
        sql += " WHERE BOR_ID = ?";
        var statement = connection.prepareStatement(sql);
        var i = 0;
        statement.setInt(++i, entity.bor_src_id);
        statement.setShort(++i, entity.bor_src_type);
        statement.setInt(++i, entity.bor_target_id);
        statement.setShort(++i, entity.bor_target_type);
        statement.setString(++i, entity.bor_name);        
        statement.setShort(++i, entity.bor_type);        
        var id = entity.bor_id;
        statement.setInt(++i, id);
        statement.executeUpdate();
            
        console.log('BO_RELATION entity with bor_id[' + id + '] updated');
        
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

	console.log('Deleting BO_RELATION entity with id[' + id + ']');
	
	if(id === undefined || id === null){
		throw new Error('Illegal argument: id[' + id + ']');
	}

    var connection = datasource.getConnection();
    try {
    	var sql = "DELETE FROM BO_RELATION WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setInt(1, id);
        statement.executeUpdate();
        
        console.log('BO_RELATION entity with bor_id[' + id + '] deleted');                
        
        return this;

    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

exports.count = function() {

	console.log('Counting BO_RELATION entities');

    var count = 0;
    var connection = datasource.getConnection();
    try {
    	var sql = 'SELECT COUNT(*) FROM BO_RELATION';
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
    
    console.log('' + count + ' BO_RELATION entities counted');

    return count;
};

exports.metadata = function() {
	var entityMetadata = {
		name: 'bo_relation',
		type: 'object',
		properties: []
	};
	
	var propertybor_id = {
		name: 'bor_id',
    	type: 'integer',
		key: 'true',
		required: 'true'
	};
    entityMetadata.properties.push(propertybor_id);

	var propertybor_src_id = {
		name: 'bor_src_id',
		type: 'integer'
	};
    entityMetadata.properties.push(propertybor_src_id);

	var propertybor_src_type = {
		name: 'bor_src_type',
		type: 'smallint'
	};
    entityMetadata.properties.push(propertybor_src_type);

	var propertybor_target_id = {
		name: 'bor_target_id',
		type: 'integer'
	};
    entityMetadata.properties.push(propertybor_target_id);

	var propertybor_target_type = {
		name: 'bor_target_type',
		type: 'smallint'
	};
    entityMetadata.properties.push(propertybor_target_type);
    
	var propertybor_name = {
		name: 'bor_name',
		type: 'varchar'
	};
    entityMetadata.properties.push(propertybor_name);    

	var propertybor_type = {
		name: 'bor_type',
		type: 'smallint'
	};
    entityMetadata.properties.push(propertybor_type);        

	response.println(JSON.stringify(entityMetadata));
};

exports.getPrimaryKeys = function() {
    var result = [];
    var i = 0;
    result[i++] = 'BOR_ID';
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

	idPropertyName: 'bor_id',
	validSortPropertyNames: [],

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
					this.get(urlParameters.id, urlParameters.expanded);
				} else if(urlParameters.metadata){
					this.metadata();
				} else if(urlParameters.count){
					this.count();
				} else if(urlParameters.list){
					this.query(urlParameters.list.limit, urlParameters.list.offset, urlParameters.list.sort, urlParameters.list.order, urlParameters.srcId, urlParameters.targetId);
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
	
	query: function(limit, offset, sort, order, sourceId, targetId){
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
		if(sourceId === undefined)
			sourceId = null;
		if(targetId === undefined)
			targetId = null;
	    try{
			var items = exports.list(limit, offset, sort, order, sourceId, targetId);
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
