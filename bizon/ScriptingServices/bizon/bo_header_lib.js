/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

var database = require("db/database");
var boItemLib = require("bizon/bo_item_lib");
var boRelationLib = require("bizon/bo_relation_lib");

/* required for the exports.http module only */
var request = require("net/http/request");
var response = require("net/http/response");
var upload = require('net/http/upload');

var datasource = database.getDatasource();

var itemsEntitySetName = "properties";
var persistentProperties = {
	mandatory: ["boh_id", "boh_name"],
	optional: ["boh_label", "boh_description", "boh_table", "boh_id_name", "boh_id_datatype_code", "boh_svc_name", "boh_svc_gen_enabled", "boh_ds_gen_enabled", "boh_ui_gen_enabled", "boh_ui_title"]
};

var parseIntStrict = function (value) {
  if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
    return Number(value);
  return NaN;
};

// Parse JSON entity into SQL and insert in db. Returns the new record id.
exports.insert = function(entity, cascaded) {

	console.info('Inserting BO_HEADER entity cascaded['+cascaded+'] :' + entity);

	if(entity === undefined || entity === null){
		throw new Error('Illegal argument: entity is ' + entity);
	}
	
	for(var i = 0; i< persistentProperties.mandatory.length; i++){
		var propName = persistentProperties.mandatory[i];
		if(propName==='boh_id')
			continue;//Skip validaiton check for id. It's epxected to be null on insert.
		var propValue = entity[propName];
		if(propValue === undefined || propValue === null){
			throw new Error('Illegal ' + propName + ' attribute value in BO_HEADER entity for insert: ' + propValue);
		}
	}

	if(cascaded === undefined || cascaded === null){
		cascaded = false;
	}

    entity = createSQLEntity(entity);

    var connection = datasource.getConnection();
    try {
        var sql = "INSERT INTO BO_HEADER (";
        sql += "BOH_ID, BOH_NAME, BOH_LABEL, BOH_TABLE, BOH_DS_GEN_ENABLED, BOH_ID_NAME, BOH_ID_DATATYPE_CODE, BOH_SVC_NAME, BOH_SVC_GEN_ENABLED, BOH_UI_GEN_ENABLED, BOH_UI_TITLE, BOH_DESCRIPTION) "; 
        sql += "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";

        var statement = connection.prepareStatement(sql);
        
        var i = 0;
        entity.boh_id = datasource.getSequence('BO_HEADER_BOH_ID').next();
         
        statement.setInt(++i,  entity.boh_id);
        statement.setString(++i, entity.boh_name);        
        statement.setString(++i, entity.boh_label);
        statement.setString(++i, entity.boh_table);
        statement.setShort(++i, entity.boh_ds_gen_enabled);
        statement.setString(++i, entity.boh_id_name);
        statement.setString(++i, entity.boh_id_datatype_code);        
        statement.setString(++i, entity.boh_svc_name);   
        statement.setShort(++i, entity.boh_svc_gen_enabled);
        statement.setShort(++i, entity.boh_ui_gen_enabled);
        statement.setString(++i, entity.boh_ui_title);        
        statement.setString(++i, entity.boh_description);
        
        statement.executeUpdate();

		if(cascaded){
			if(entity[itemsEntitySetName] && entity[itemsEntitySetName].length > 0){
	        	for(var j=0; j<entity[itemsEntitySetName].length; j++){
	        		var item = entity[itemsEntitySetName][j];
	        		if(item.boi_type !== 'Relationship'){
		        		item.boi_boh_name = entity.boh_name;
						boItemLib.insert(item);        				
        			} else {
		        		item.bor_src_id = entity.boh_id;
						boRelationLib.insert(item);
    				}
	    		}
	    	}
		}

        console.info('BO_HEADER entity inserted with boh_id[' +  entity.boh_id + ']');

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

	console.info('Finding BO_HEADER entity with id ' + id);

	if(id === undefined || id === null){
		throw new Error('Illegal argument for id parameter:' + id);
	}

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
            	console.info('BO_HEADER entity with id[' + id + '] found');
        } 
        return entity;
    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

// Reads a single entity by id, parsed into JSON object 
exports.findByName = function(name) {

	console.info('Finding BO_HEADER entity with name ' + name);

	if(name === undefined || name === null){
		throw new Error('Illegal argument for parameter name[' + name + ']');
	}

    var connection = datasource.getConnection();
    try {
        var entity;
        var sql = "SELECT * FROM BO_HEADER WHERE BOH_NAME = '" + name + "'";
        var statement = connection.prepareStatement(sql);
        statement.setString(1, name);
        
        var resultSet = statement.executeQuery();
        if (resultSet.next()) {
            entity = createEntity(resultSet);
			if(entity)
            	console.info('BO_HEADER entity with name[' + name + '] found');
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
exports.list = function(limit, offset, sort, order, expanded, entityName) {

	console.info('Listing BO_HEADER entity collection expanded['+expanded+'] with list operators: limit['+limit+'], offset['+offset+'], sort['+sort+'], order['+order+'], entityName['+entityName+']');
	
    var connection = datasource.getConnection();
    try {
        var entities = [];
        var sql = "SELECT";
        if (limit !== null && offset !== null) {
            sql += " " + datasource.getPaging().genTopAndStart(limit, offset);
        }
        sql += " * FROM BO_HEADER";
        if (entityName !== null) {
        	sql += " WHERE BOH_LABEL LIKE '" + entityName + "%%'";
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
        var resultSet = statement.executeQuery();
        while (resultSet.next()) {
        	var entity = createEntity(resultSet);
        	if(expanded !== null && expanded!==undefined){
			   var dependentItemEntities = boItemLib.list(entity.boh_name, null, null, null, null);
			   if(dependentItemEntities) {
			   	 entity[itemsEntitySetName] = dependentItemEntities;
		   	   }
			   var dependentRelationEntities = boRelationLib.list(null, null, null, null, entity.boh_name, null);
			   if(dependentRelationEntities) {
			   	if(!entity[itemsEntitySetName])
			   		entity[itemsEntitySetName] = [];
			   	 entity[itemsEntitySetName] = entity[itemsEntitySetName].concat(dependentRelationEntities);
		   	   }
			}
            entities.push(entity);
        }
        
        console.info('' + entities.length +' BO_HEADER entities found');
        
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
    entity.boh_name = resultSet.getString("BOH_NAME");	
    entity.boh_label = resultSet.getString("BOH_LABEL");
    entity.boh_table = resultSet.getString("BOH_TABLE");
    entity.boh_ds_gen_enabled = resultSet.getShort("BOH_DS_GEN_ENABLED");    	
    entity.boh_id_name = resultSet.getString("BOH_ID_NAME");
    entity.boh_id_datatype_code = resultSet.getString("BOH_ID_DATATYPE_CODE");
    entity.boh_svc_name = resultSet.getString("BOH_SVC_NAME");
    entity.boh_svc_gen_enabled = resultSet.getShort("BOH_SVC_GEN_ENABLED");        
    entity.boh_ui_gen_enabled = resultSet.getShort("BOH_UI_GEN_ENABLED");      
    entity.boh_ui_title = resultSet.getString("BOH_UI_TITLE");      
	entity.boh_description = resultSet.getString("BOH_DESCRIPTION");
	if(entity.boh_ds_gen_enabled!==null){
	    if(entity.boh_ds_gen_enabled > 0)
	    	entity.boh_ds_gen_enabled = true;
	    else if(entity.boh_ds_gen_enabled < 1)
	       	entity.boh_ds_gen_enabled = false;    	
	}
	if(entity.boh_svc_gen_enabled!==null){
	    if(entity.boh_svc_gen_enabled > 0)
	    	entity.boh_svc_gen_enabled = true;
	    else if(entity.boh_svc_gen_enabled < 1)
	       	entity.boh_svc_gen_enabled = false;    	
	}
	if(entity.boh_ui_gen_enabled!==null){
	    if(entity.boh_ui_gen_enabled > 0)
	    	entity.boh_ui_gen_enabled = true;
	    else if(entity.boh_ui_gen_enabled < 1)
	       	entity.boh_ui_gen_enabled = false;    	
	}	
	for(var key in Object.keys(entity)){
		if(entity[key] === null)
			entity[key] = undefined;
	}	
    console.error("Transformation from DB JSON object finished: " + entity);    
    return entity;
}

//Prepare a JSON object for insert into DB
function createSQLEntity(entity) {
	for(var key in Object.keys(entity)){
		if(entity[key] === undefined){
			entity[key] = null;
		}
	}
	if(entity.boh_ds_gen_enabled === true){
		entity.boh_ds_gen_enabled = 1;
		if(entity.boh_table !== undefined){
			// Validation rule: up to 128 Characters, Starts with letter only, Can include or end with number, No spaces, case insensitive
			var isTableNameValid = /^[A-Za-z][A-Za-z0-9]{0,127}$/.test(entity.boh_table);//TODO: validation needs to come from database dialect provider
			if(!isTableNameValid)
				throw new Error("Illegal arugment: boh_table["+entity.boh_table+"] does not comply with validation rules [128 Characters, Starts with letter only, Can include or end with numbers, No spaces, Case insensitive]");
		} else {
			var regex = new RegExp('[^a-z0-9]*', "ig");
			var tblName = entity.boh_label.replace(regex, '');
			if(!/^[a-z]/i.test(tblName)){
				tblName = 'tbl'+ tblName;
			}
			if(tblName.length>124)
				tblName = tblName.substring(0, 124);
			tblName += createRadnomAlphanumeric(4);
			entity.boh_table = tblName;
			console.info('Generated boh_table['+entity.boh_table+']');
		}
		if(entity.boh_id_name !== undefined){
			var isIdNameValid = /^[a-zA-Z_][a-zA-Z0-9_]{0,255}$/.test(entity.boh_id_name);//TODO: validation needs to come from database dialect provider
			if(!isIdNameValid)
				throw new Error("Illegal arugment: boh_id_name["+entity.boh_id_name+"] does not comply with validation rules");
		} else {
			entity.boh_id_name = "id";
			console.info('Generated boh_id_name['+entity.boh_id_name+']');
		}
		if(entity.boh_id_datatype_code !== undefined){
			/*var isIdDataTypeValid = !isNaN(entity.boh_id_datatype_code) && [0,1,2,3,4,5,6,7,8,9].indexOf(entity.boh_id_datatype_code);//TODO: extenralize valid codes
			if(!isIdDataTypeValid)
				throw new Error("Illegal arugment: boh_id_datatype_code["+entity.boh_id_datatype_code+"] does not comply with validation rules");*/
		} else {
			entity.boh_id_datatype_code = "INTEGER";
		}
	} else {
		entity.boh_ds_gen_enabled = 0;	
	}
	if(entity.boh_svc_gen_enabled === true){
		entity.boh_svc_gen_enabled = 1;
		if(entity.boh_svc_name !== undefined){
			var isSvcNameValid = /^(?=[\S])[^\\ \/ : * ? " < > | ]{0,255}$/.test(entity.boh_svc_name);//TODO add inner whitespaces to validaiton here too
			if(!isSvcNameValid || /\s/g.test(entity.boh_svc_name))
				throw new Error("Illegal arugment: boh_svc_name["+entity.boh_svc_name+"] does not comply with validation rules");
		} else {
			var svcName = entity.boh_label;
			var invalidSvcNameCharactersMatcher = new RegExp('[\\ \/ : * ? " < > | \s]', "g");
			svcName = svcName.replace(invalidSvcNameCharactersMatcher , '');
			if(!/^[a-z]/i.test(svcName)){
				svcName = 'svc'+ svcName;
			}
			if(svcName.length>251)
				svcName = svcName.substring(0, 251);			
			svcName += createRadnomAlphanumeric(4);
			entity.boh_svc_name = svcName;
			console.info('Generated boh_svc_name['+entity.boh_svc_name+']');
		}
	} else {
		entity.boh_svc_gen_enabled = 0;	
	}
	if(entity.boh_ui_gen_enabled === true){
		entity.boh_ui_gen_enabled = 1;
		if(entity.boh_ui_title !== undefined){
			if(entity.boh_ui_title.length>255)
				throw new Error("Illegal arugment: bo_ui_title["+entity.boh_ui_title+"] does not comply with validation rules. Longer than 255 characters.");
		} else {
			entity.boh_ui_title = entity.boh_label;
			console.info('Autoassigned boh_ui_title['+entity.boh_ui_title+']');			
		}
	} else {
		entity.boh_ui_gen_enabled = 0;	
	}		
	console.info("Transformation to DB JSON object finished: " + entity);
	return entity;
}

function createRadnomAlphanumeric(length){
	if(!length)
		length = 4;
	var power = length;
	var sliceIndex = -Math.abs(length);
    return ("0000" + (Math.random()*Math.pow(36,power) << 0).toString(36)).slice(sliceIndex);
}

// update entity from a JSON object. Returns the id of the updated entity.
exports.update = function(entity) {

	console.info('Updating BO_HEADER entity ' + entity);

	if(entity === undefined || entity === null){
		throw new Error('Illegal argument: entity is ' + entity);
	}	
	
	for(var i = 0; i< persistentProperties.mandatory.length; i++){
		var propName = persistentProperties.mandatory[i];
		var propValue = entity[propName];
		if(propValue === undefined || propValue === null){
			throw new Error('Illegal ' + propName + ' attribute value in BO_HEADER entity for update: ' + propValue);
		}
	}
	
	entity = createSQLEntity(entity);
	
    var connection = datasource.getConnection();
    try {
    
        var sql = "UPDATE BO_HEADER";
        sql += " SET BOH_NAME=?, BOH_LABEL=?, BOH_TABLE=?, BOH_DS_GEN_ENABLED=?, BOH_ID_NAME=?, BOH_ID_DATATYPE_CODE=?, BOH_SVC_NAME=?, BOH_SVC_GEN_ENABLED=?, BOH_UI_GEN_ENABLED=?, BOH_UI_TITLE=?, BOH_DESCRIPTION = ?"; 
        sql += " WHERE BOH_ID = ?";
        var statement = connection.prepareStatement(sql);
        var i = 0;
        statement.setString(++i, entity.boh_name);        
        statement.setString(++i, entity.boh_label);
        statement.setString(++i, entity.boh_table);
        statement.setShort(++i, entity.boh_ds_gen_enabled);
        statement.setString(++i, entity.boh_id_name);
        statement.setString(++i, entity.boh_id_datatype_code);        
        statement.setString(++i, entity.boh_svc_name);   
        statement.setShort(++i, entity.boh_svc_gen_enabled);
        statement.setShort(++i, entity.boh_ui_gen_enabled);
        statement.setString(++i, entity.boh_ui_title);      
        statement.setString(++i, entity.boh_description);        
        var id = entity.boh_id;
        statement.setInt(++i, id);
        statement.executeUpdate();
            
        console.info('BO_HEADER entity with boh_id[' + id + '] updated');
        
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

	console.info('Deleting BO_HEADER entity with id[' + id + '], cascaded['+cascaded+']');

    var connection = datasource.getConnection();
    try {
    
    	var name;
    	if(cascaded){
    		var entity = exports.find(id);
    		if(entity){
    			name = entity.boh_name;
    		}
    	}
    
    	var sql = "DELETE FROM BO_HEADER";
    	
    	if(id !== null){
    	 	sql += " WHERE " + exports.pkToSQL();
    	 	if(id.constructor === Array){
    	 		sql += "IN ("+id.join(',')+")";
    	 	} else {
    	 		" = "  + id;
    	 	}
		}

        var statement = connection.prepareStatement(sql);
        if(id!==null && id.constructor !== Array){
        	statement.setString(1, id);
        }
        statement.executeUpdate();
        
		if(cascaded===true && name!==null){
			var dependentItems = boItemLib.list(name);
			for(var i = 0; i < dependentItems.length; i++) {
        		boItemLib.remove(dependentItems[i].boi_id);
			}
			var dependentRelationEntities = boRelationLib.list(null, null, null, null, name, name);
			for(var i = 0; i < dependentRelationEntities.length; i++) {
        		boRelationLib.remove(dependentRelationEntities[i].bor_id);
			}
		}        
        
        console.info('BO_HEADER entity with boh_id[' + id + '] deleted');                
        
        return this;

    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

exports.count = function() {

	console.info('Counting BO_HEADER entities');

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
    
    console.info('' + count + ' BO_HEADER entities counted');

    return count;
};

exports.metadata = function() {

	console.info('Exporting metadata for BO_HEADER type');

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

	var propertyboh_label = {
		name: 'boh_label',
		type: 'string'
	};
    entityMetadata.properties.push(propertyboh_label);

	var propertyboh_table = {
		name: 'boh_table',
		type: 'string'
	};
    entityMetadata.properties.push(propertyboh_table);

	var propertyboh_ds_gen_enabled = {
		name: 'boh_ds_gen_enabled',
		type: 'booblean'
	};
    entityMetadata.properties.push(propertyboh_ds_gen_enabled);

	var propertyboh_id_name = {
		name: 'boh_id_name',
		type: 'string'
	};
    entityMetadata.properties.push(propertyboh_id_name);

	var propertyboh_id_datatype_code = {
		name: 'boh_id_datatype_code',
		type: 'string'
	};
    entityMetadata.properties.push(propertyboh_id_datatype_code);

	var propertyboh_svc_gen_enabled = {
		name: 'boh_svc_gen_enabled',
		type: 'booblean'
	};
    entityMetadata.properties.push(propertyboh_svc_gen_enabled);

	var propertyboh_svc_name = {
		name: 'boh_svc_name',
		type: 'string'
	};
    entityMetadata.properties.push(propertyboh_svc_name);

	var propertyboh_ui_gen_enabled = {
		name: 'boh_ui_gen_enabled',
		type: 'booblean'
	};
    entityMetadata.properties.push(propertyboh_ui_gen_enabled);

	var propertyboh_ui_title = {
		name: 'boh_ui_title',
		type: 'string'
	};
    entityMetadata.properties.push(propertyboh_ui_title);   
    
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
	validSortPropertyNames: ['boh_id','boh_name','boh_label'],

	dispatch: function(urlParameters){
		var method = request.getMethod().toUpperCase();
		console.info('Dispatching operation request for HTTP Verb['+ method +'] and URL parameters: ' + urlParameters);

		if('POST' === method){
			if (upload.isMultipartContent()) {
				this.importData();
			} else {
				this.create(urlParameters.cascaded);
			}
		} else if('PUT' === method){
			this.update(urlParameters.cascaded);
		} else if('DELETE' === method){
			if(urlParameters.id !== null){
				this.remove(urlParameters.id, urlParameters.cascaded);	
			} else {
				this.deleteData(urlParameters.cascaded);	
			}
		} else if('GET' === method){
			if(urlParameters){
				if(urlParameters.id){
					this.get(urlParameters.id, urlParameters.expanded);
				} else if(urlParameters.metadata){
					this.metadata();
				} else if(urlParameters.count){
					this.count();
				}  else if(urlParameters.getByName){
					this.getByName(urlParameters.getByName);
				} else if(urlParameters.list){
					this.query(urlParameters.list.limit, urlParameters.list.offset, urlParameters.list.sort, urlParameters.list.order, urlParameters.expanded, urlParameters.queryByName);
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
		if(id === undefined || isNaN(parseIntStrict(id))) {
			this.printError(response.BAD_REQUEST, 1, "Invallid id parameter: " + id);
			return;
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
	
	getByName: function(name, expanded){
		//name is mandatory parameter
		if(name === undefined) {
			this.printError(response.BAD_REQUEST, 1, "Invallid name parameter: " + name);
			return;
		}

	    try{
			var item = exports.getByName(name, expanded);
			if(!item){
        		this.printError(response.NOT_FOUND, 1, "Record with name: " + name + " does not exist.");
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
	
	query: function(limit, offset, sort, order, expanded, entityName){
		if (offset === undefined || offset === null) {
			offset = 0;
		} else if(isNaN(parseIntStrict(offset)) || offset<0) {
			this.printError(response.BAD_REQUEST, 1, "Invallid offset parameter: " + offset + ". Must be a positive integer.");
			return;
		}

		if (limit === undefined || limit === null) {
			limit = 0;
		}  else if(isNaN(parseIntStrict(limit)) || limit<0) {
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
			var items = exports.list(limit, offset, sort, order, expanded, entityName);
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
	
	importData: function(){
		try{
			var files = upload.parseRequest();
			var json = [];
			files.forEach(function(file) {
				var uploadStatus = {
					"file": file.name,
				};
				var content = String.fromCharCode.apply(null, file.data);		
				try {
					var objectsForImport = JSON.parse(content);
					for(var i=0; i< objectsForImport.length; i++){
						console.info('Inserting object ' + objectsForImport[i].boh_label);
						objectsForImport[i][this.idPropertyName] = exports.insert(objectsForImport[i], true);
					}
					uploadStatus.status="ok";
				} catch (err) {
					uploadStatus.status="error";
					uploadStatus.details = err.message;
					throw err;
				} finally {
					json.push(uploadStatus);
				}
			});
			response.println(JSON.stringify(json));
			response.setStatus(response.OK);
		} catch(err){
			var errorCode = response.INTERNAL_SERVER_ERROR;
        	this.printError(errorCode, errorCode, err.message, err.errContext);
        	throw err;
		} finally {
			response.flush();
			response.close();
		}
	},
	
	deleteData: function(cascaded){
		console.info('Deleting multiple objects');
		try{
			var input = request.readInputText();
			console.info('Deleting entities '+ (input || 'all'));
			var ids = null;
			if(input){
				ids = JSON.parse(input);
			}
	    	exports.remove(ids, cascaded);
			response.setStatus(response.NO_CONTENT);
		} catch(err){
			var errorCode = response.INTERNAL_SERVER_ERROR;
        	this.printError(errorCode, errorCode, err.message, err.errContext);
        	throw err;
		} finally {
			response.flush();
			response.close();
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
})();
