/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

	var entityDAO = require("bizon/lib/header_dao");
	
	var request = require("net/http/request");
	var response = require("net/http/response");
	var upload = require('net/http/upload');
	var restUtils = require("bizon/svc/rest/utils");
	
	var $log = {
		error: function(errCode, errMessage, errContext){
			console.error('['+errCode+']: '+ errMessage);
		    if (errContext !== null) {
		    	console.error(JSON.stringify(errContext));
		    }
		}
	};

	var api = function(){
	
		this.idPropertyName = 'boh_id';
		this.validSortPropertyNames = ['boh_id','boh_name','boh_label'];
	
		this.getByName = function(name, expanded){
			//name is mandatory parameter
			if(name === undefined) {
				$log.error(1, "Invallid name parameter: " + name);
				restUtils.printError(response.BAD_REQUEST, 1, "Invallid name parameter: " + name);
				return;
			}
	
		    try{
				var item = entityDAO.getByName(name, expanded);
				if(!item){
					$log.error(1, "Record with name: " + name + " does not exist.");
	        		restUtils.printError(response.NOT_FOUND, 1, "Record with name: " + name + " does not exist.");
	        		return;
				}
				var jsonResponse = JSON.stringify(item, null, 2);
		        response.println(jsonResponse);
			} catch(e) {
	    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
	    	    $log.error(errorCode, e.message, e.errContext);
	        	restUtils.printError(errorCode, errorCode, e.message, e.errContext);
	        	throw e;
			}		
		};
		
		this.importData = function(){
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
							objectsForImport[i][this.idPropertyName] = entityDAO.insert(objectsForImport[i], true);
						}
						uploadStatus.status="ok";
					} catch (err) {
						$log.error(1, err.message);
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
				$log.error(errorCode, err.message, err.errContext);
	        	restUtils.printError(errorCode, errorCode, err.message, err.errContext);
	        	throw err;
			} finally {
				response.flush();
				response.close();
			}
		};
		
		this.deleteData = function(cascaded){
			console.info('Deleting multiple objects');
			try{
				var input = request.readInputText();
				console.info('Deleting entities '+ (input || 'all'));
				var ids = null;
				if(input){
					ids = JSON.parse(input);
				}
		    	entityDAO.remove(ids, cascaded);
				response.setStatus(response.NO_CONTENT);
			} catch(err){
				var errorCode = response.INTERNAL_SERVER_ERROR;
				$log.error(errorCode, err.message, err.errContext);
	        	restUtils.printError(errorCode, errorCode, err.message, err.errContext);
	        	throw err;
			} finally {
				response.flush();
				response.close();
			}
		};	
		return this;
	};	
	
	restUtils.asRestAPI.call(api.prototype, entityDAO);

	//override default GET list operation handler for this resource
	api.prototype.cfg[""].get.handler = function(context){
		var limit = context.queryParams.limit;
		var offset = context.queryParams.offset;
		var sort = context.queryParams.sort || null;
		var order = context.queryParams.order || null;
		var expanded = context.queryParams.expanded || false;
		var queryByName = context.queryParams.entityName || null;
		var getByName = context.queryParams.getByName || null;
		
		if(getByName!==null){
			this.getByName(getByName, expanded);
		} else {
		    try{
				var entities = this.getDAO().list(limit, offset, sort, order, expanded, queryByName);
		        var jsonResponse = JSON.stringify(entities, null, 2);
		    	response.println(jsonResponse);      	
			} catch(e) {
	    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
	    	    $log.error(errorCode, e.message, e.errContext);					
	        	restUtils.printError(errorCode, errorCode, e.message, e.errContext);
	        	throw e;
			}	
		} 		
	};
	
	api.prototype.cfg[""].post = {
		consumes: ['application/json'],
		handler: function(context) {
			this.importData();
		}
	};
	
	api.prototype.cfg[""]["delete"] = {
		consumes: ['application/json'],
		handler: function(context) {
			this.deleteData(context.queryParams.cascaded);
		}	
	};	
	
	var headerREST = new api(entityDAO);
	
	(function(request, response) {
		
		response.setContentType("application/json; charset=UTF-8");
		response.setCharacterEncoding("UTF-8");

		headerREST.service();

		response.flush();
		response.close();
		
	})(request, response);

})();
