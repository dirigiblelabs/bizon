/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

	var entityDAO = require("bizon/lib/header_dao");
	
	var request = require("net/http/request");
	var response = require("net/http/response");
	var upload = require('net/http/upload');
	var xss = require("utils/xss");
	var restUtils = require("bizon/svc/rest/utils");
	
/*	var parseIntStrict = function (value) {
	  if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
	    return Number(value);
	  return NaN;
	};*/
	
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
				restUtils.printError(response.BAD_REQUEST, 1, "Invallid name parameter: " + name);
				return;
			}
	
		    try{
				var item = entityDAO.getByName(name, expanded);
				if(!item){
	        		restUtils.printError(response.NOT_FOUND, 1, "Record with name: " + name + " does not exist.");
	        		return;
				}
				var jsonResponse = JSON.stringify(item, null, 2);
		        response.println(jsonResponse);
			} catch(e) {
	    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
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
	        	restUtils.printError(errorCode, errorCode, err.message, err.errContext);
	        	throw err;
			} finally {
				response.flush();
				response.close();
			}
		};	
	
		this.dispatch = function(urlParameters){
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
				restUtils.printError(response.BAD_REQUEST, 4, "Invalid HTTP Method", method);
			}
		};
		return this;
	};	
	
	restUtils.asRestAPI.call(api.prototype, entityDAO);
	
	var headerREST = new api(entityDAO);
	
	(function(request, response) {
		
		response.setContentType("application/json; charset=UTF-8");
		response.setCharacterEncoding("UTF-8");
		
		//get primary keys (one primary key is supported!)
		var idParameter = entityDAO.getPrimaryKey();
		var urlParameters = restUtils.urlParametersDigest(idParameter);
		if(urlParameters){
			urlParameters.queryByName = xss.escapeSql(request.getParameter('name'));//TODO rename this and below params
			urlParameters.getByName = xss.escapeSql(request.getParameter('getByName'));
			headerREST.dispatch(urlParameters);		
		}	
		// flush and close the response
		response.flush();
		response.close();
		
	})(request, response);

})();
