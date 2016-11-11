/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

	var request = require("net/http/request");
	var response = require("net/http/response");
	var xss = require("utils/xss");
	
	exports.printError = function(httpCode, errCode, errMessage, errContext, contentType) {
	    var body = {'err': {'code': errCode, 'message': errMessage}};
	    response.setStatus(httpCode);
	    response.setHeader("Content-Type", (contentType || "application/json"));
	    response.print(JSON.stringify(body));
	};
	
	var $log = {
		error: function(errCode, errMessage, errContext){
			console.error('['+errCode+']: '+ errMessage);
		    if (errContext !== null) {
		    	console.error(JSON.stringify(errContext));
		    }
		}
	};	
	
	exports.urlParametersDigest = function(idParameter){
		
		// retrieve the id as parameter if exist
		var id = xss.escapeSql(request.getParameter(idParameter)) || request.getAttribute("path");
		var count = xss.escapeSql(request.getParameter('count'));
		var metadata = xss.escapeSql(request.getParameter('metadata'));
		var expanded = xss.escapeSql(request.getParameter('expanded'));
		var cascaded = xss.escapeSql(request.getParameter('cascaded'));	
	
		if(checkConflictingParameters(id, count, metadata)){
			var limit = xss.escapeSql(request.getParameter('limit'));
			if (limit === null) {
				limit = 100;
			}
			var offset = xss.escapeSql(request.getParameter('offset'));
			if (offset === null) {
				offset = 0;
			}
			
			var sort = xss.escapeSql(request.getParameter('sort'));
			var order = xss.escapeSql(request.getParameter('order'));
			
			return {
				"id": id,
				"metadata": metadata!==null,
				"count": count!==null,
				"list" : {
					"limit": limit,
					"offset": offset,
					"sort": sort,	
					"order": order			
				},
				"expanded": expanded!==null,
				"cascaded": cascaded!==null
			};
		}
	};
	
	var checkConflictingParameters = function(id, count, metadata) {
	    if(id !== null && count !== null ){
	    	exports.printError(response.EXPECTATION_FAILED, 1, "Expectation failed: conflicting parameters - id, count");
	        return false;
	    }
	    if(id !== null && metadata !== null){
	    	exports.printError(response.EXPECTATION_FAILED, 2, "Expectation failed: conflicting parameters - id, metadata");
	        return false;
	    }
	    return true;
	};
	
	var parseIntStrict = function (value) {
	  if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
	    return Number(value);
	  return NaN;
	};	
	
	exports.asRestAPI = function(dao) {
	
		this.create = function(cascaded){
			var input = request.readInputText();
		    var entity = JSON.parse(input);
		    try{
				entity[dao.getPrimaryKey()] = dao.insert(entity, cascaded);
				response.setStatus(response.OK);
				response.setHeader('Location', $.getRequest().getRequestURL().toString() + '/' + entity[dao.getPrimaryKey()]);
			} catch(e) {
	    	    var errorCode = response.INTERNAL_SERVER_ERROR;
	    	    $log.error(errorCode, e.message, e.errContext);
	        	exports.printError(errorCode, errorCode, e.message, e.errContext);
	        	throw e;
			}		
		};
		
		this.remove = function(id, cascaded){
		 	try{
				dao.remove(id, cascaded);
				response.setStatus(response.NO_CONTENT);
			} catch(e) {
	    	    var errorCode = response.INTERNAL_SERVER_ERROR;
	    	    $log.error(errorCode, e.message, e.errContext);
	        	exports.printError(errorCode, errorCode, e.message, e.errContext);
	        	throw e;
			}
		};
		
		this.update = function(cascaded){
			var input = request.readInputText();
		    var item = JSON.parse(input);
		    try{
				item[dao.getPrimaryKey()] = dao.update(item, cascaded);
				response.setStatus(response.NO_CONTENT);
			} catch(e) {
	    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
	    	    $log.error(errorCode, e.message, e.errContext);
	        	exports.printError(errorCode, errorCode, e.message, e.errContext);
	        	throw e;
			}
		}
		
		this.get = function(id, expanded){
			//id is mandatory parameter and an integer
			if(id === undefined || isNaN(parseIntStrict(id))) {
				exports.printError(response.BAD_REQUEST, 1, "Invallid id parameter: " + id);
				return;
			}
	
		    try{
				var item = dao.find(id, expanded);
				if(!item){
					$log.error(1, "Record with id: " + id + " does not exist.");
	        		exports.printError(response.NOT_FOUND, 1, "Record with id: " + id + " does not exist.");
	        		return;
				}
				var jsonResponse = JSON.stringify(item, null, 2);
		        response.println(jsonResponse);
			} catch(e) {
	    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
				$log.error(errorCode, e.message, e.errContext);		    	    
	        	exports.printError(errorCode, errorCode, e.message, e.errContext);
	        	throw e;
			}	
		};
		
		this.query = function(limit, offset, sort, order, expanded){
			if (offset === undefined || offset === null) {
				offset = 0;
			} else if(isNaN(parseIntStrict(offset)) || offset<0) {
				$log.error(1, "Invallid offset parameter: " + offset + ". Must be a positive integer.");				
				exports.printError(response.BAD_REQUEST, 1, "Invallid offset parameter: " + offset + ". Must be a positive integer.");
				return;
			}
	
			if (limit === undefined || limit === null) {
				limit = 0;
			}  else if(isNaN(parseIntStrict(limit)) || limit<0) {
				$log.error(1, "Invallid limit parameter: " + limit + ". Must be a positive integer.");
				exports.printError(response.BAD_REQUEST, 1, "Invallid limit parameter: " + limit + ". Must be a positive integer.");
				return;			
			}
			if (sort === undefined) {
				sort = null;
			} else if( sort !== null &&  this.validSortPropertyNames && this.validSortPropertyNames.indexOf(sort)<0){
				$log.error(1, "Invalid sort by property name: " + sort);
				exports.printError(response.BAD_REQUEST, 1, "Invald sort by property name: " + sort);
				return;
			}
			if (order === undefined) {
				order = null;
			} else if(order!==null){
				if(sort === null){
					$log.error(1, "Parameter order is invalid without paramter sort to order by.");
					exports.printError(response.BAD_REQUEST, 1, "Parameter order is invalid without paramter sort to order by.");
					return;
				} else if(['asc', 'desc'].indexOf(order.trim().toLowerCase())){
					$log.error(1, "Invallid order parameter: " + order + ". Must be either ASC or DESC.");					
					exports.printError(response.BAD_REQUEST, 1, "Invallid order parameter: " + order + ". Must be either ASC or DESC.");
					return;
				}
			}
			
			//add any aditional params
			var args = Array.prototype.slice.call(arguments);			
			if(args.length>5){
				args = [limit, offset, sort, order, expanded].concat(args.slice(args.length-1));
			} else {
				args = [limit, offset, sort, order, expanded];
			}
		    try{
				var entities = dao.list.apply(this, args);
		        var jsonResponse = JSON.stringify(entities, null, 2);
		    	response.println(jsonResponse);
			} catch(e) {
	    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
	    	    $log.error(errorCode, e.message, e.errContext);
	        	exports.printError(errorCode, errorCode, e.message, e.errContext);
	        	throw e;
			}		
		};		
		
		this.count = function(){
		    try{
				var itemsCount = dao.count();
	/*			response.setHeader("Content-Type", "text/plain");*/			
				response.setHeader("Content-Type", "application/json");//TMP to accommodate the ui which handles only json
	/*	    	response.println(itemsCount);      	 */
		    	response.println('{"count":'+itemsCount+'}'); 
			} catch(e) {
	    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
	    	    $log.error(errorCode, e.message, e.errContext);
	        	exports.printError(errorCode, errorCode, e.message, e.errContext);
	        	throw e;
			}
		}
		
		this.metadata = function(){
		 		try{
					var entityMetadata = dao.metadata();
					response.setHeader("Content-Type", "application/json");
				response.println(entityMetadata);
				} catch(e) {
		    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
		    	    $log.error(errorCode, e.message, e.errContext);
		        	exports.printError(errorCode, errorCode, e.message, e.errContext);
		        	throw e;        	
				}		
		};
	  
		return this;
	}; 
	
})();
