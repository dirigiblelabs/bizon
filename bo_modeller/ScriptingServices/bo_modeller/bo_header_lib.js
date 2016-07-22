/* globals $ */
/* eslint-env node, dirigible */

var request = require("net/http/request");
var response = require("net/http/response");
var database = require("db/database");
var boItemLib = require("bo_modeller/bo_item_lib");

var datasource = database.getDatasource();

// create entity by parsing JSON object from request body
exports.createBo_header = function(header) {
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
        header.boh_id = datasource.getSequence('BO_HEADER_BOH_ID').next();
        statement.setInt(++i,  header.boh_id);
        statement.setString(++i, header.boh_name);
        statement.setString(++i, header.boh_table);
        statement.setString(++i, header.boh_description);
        statement.executeUpdate();

        if(header.properties && header.properties.length>0){
        	for(var j=0; j<header.properties.length; j++){
        		var property = header.properties[j];
        		property.boi_boh_id = header.boh_id;
				boItemLib.createBo_items(property);
    		}
    	}
        return  header.boh_id;
    } catch(e) {
		e.errContext = sql;
		throw e;
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
        } 
        if(!header){
        	return;
    	}
		if(expanded){
			//limit, offset, sort, order?
		   var properties = boItemLib.readBo_itemsList(header.boh_id, null, null, null, null);
		   if(properties){
		   	 header.properties = properties;
	   	   }
		}
		return header;
    } catch(e) {
		e.errContext = sql;
		throw e;
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
        	   //separate limit, offset, sort, order?
			   var properties = boItemLib.readBo_itemsList(header.boh_id, null, null, null, null);
			   if(properties) {
			   	 header.properties = properties;
		   	   }
			}
            headers.push(header);
        }
        return headers;
    } catch(e) {
		e.errContext = sql;
		throw e;
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
exports.updateBo_header = function(header, cascaded) {

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
        	if(header.properties && header.properties.length>0){
        		for(var j=0; j<header.properties.length;j++){
        			var item = header.properties[j];
        			if(item.id){
        				boItemLib.updateBo_items(item);
        			} else {
        				boItemLib.createBo_items(item);
        			}
        		}	
        	}
        }
        return id;
    } catch(e) {
		e.errContext = sql;
		throw e;
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
        return id;
    } catch(e) {
		e.errContext = sql;
		throw e;
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
    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
    return count;
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

	return entityMetadata;
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

	dispatch: function(urlParameters){
		var method = request.getMethod().toUpperCase();
		if('POST' === method){
			this.createBO_Header();
		} else if('PUT' === method){
			this.updateBO_Header(urlParameters.cascaded);
		} else if('DELETE' === method){
			this.deleteBO_Header(urlParameters.id, urlParameters.cascaded);
		} else if('GET' === method){
			if(urlParameters){
				if(urlParameters.id){
					this.readBO_Header(urlParameters.id, urlParameters.expanded);
				} else if(urlParameters.metadata){
					this.metadataBO_Headers();
				} else if(urlParameters.count){
					this.countBO_Headers();
				} else if(urlParameters.list){
					this.readBO_HeadersList(urlParameters.list.limit, urlParameters.list.offset, urlParameters.list.sort, urlParameters.list.desc, urlParameters.expanded);
				}
			} else {
				this.readBO_HeadersList();
			}
		} else {
			this.printError(response.BAD_REQUEST, 4, "Invalid HTTP Method", method);
		}

	}, 

	createBO_Header: function(){
		var input = request.readInputText();
	    var item = JSON.parse(input);
	    try{
			item.id = exports.createBo_header(item);
			response.setStatus(response.OK);
			response.setHeader('Location', $.getRequest().getRequestURL().toString() + '/' + item.id);
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}
	},
	
	updateBO_Header: function(cascaded) {
		var input = request.readInputText();
	    var item = JSON.parse(input);
	    try{
			item.id = exports.updateBo_header(item, cascaded);
			response.setStatus(response.NO_CONTENT);
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}
	},
	
	deleteBO_Header: function(id, cascaded) {
	    try{
			exports.deleteBo_header(id, cascaded);
			response.setStatus(response.NO_CONTENT);
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}
	},
	
	readBO_Header: function(id, expanded){
		//id is mandatory parameter and an integer
		if(id === undefined || isNaN(parseInt(id))) {
			this.printError(response.BAD_REQUEST, 1, "Invallid id parameter: " + id);
		}

	    try{
			var item = exports.readBo_headerEntity(id, expanded);
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
	
	readBO_HeadersList: function(limit, offset, sort, desc, expanded){
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
			var items = exports.readBo_headerList(limit, offset, sort, desc, expanded);
	        var jsonResponse = JSON.stringify(items, null, 2);
	    	response.println(jsonResponse);      	
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}		
	},
	
	countBO_Headers: function(){
	    try{
			var itemsCount = exports.countBo_header();
			response.setHeader("Content-Type", "text/plain");
	    	response.println(itemsCount);      	
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
        	this.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}		
	},
	
	metadataBO_Headers: function(){
 		try{
			var entityMetadata = exports.metadataBo_header();
			response.setHeader("Content-Type", "application/json");
			response.println(JSON.stringify(entityMetadata));
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