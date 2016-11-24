/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";
	
	var arester = require("arestme/arester");

	var headerDAO = require("bizon/lib/header_dao");
	var Header = arester.asRestAPI(headerDAO);
	Header.prototype.logger.ctx = "Header Svc";
	Header.prototype.validSortPropertyNames = ['boh_id','boh_name','boh_label'];
	
	var getByName = function(name, expanded, io){
		//name is mandatory parameter
		if(name === undefined) {
			this.logger.error(1, "Invallid name parameter: " + name);
			this.sendError(io, io.response.BAD_REQUEST, 1, "Invallid name parameter: " + name);
			return;
		}
	
	    try{
	    	
			var item = this.dao.findByName(name, expanded);
			if(!item){
				this.logger.error(1, "Record with name: " + name + " does not exist.");
	    		this.sendError(io, io.response.NOT_FOUND, 1, "Record with name: " + name + " does not exist.");
	    		return;
			}
			var jsonResponse = JSON.stringify(item, null, 2);
	        io.response.println(jsonResponse);
		} catch(e) {
		    var errorCode = io.response.INTERNAL_SERVER_ERROR ;
		    this.logger.error(errorCode, e.message, e.errContext);
	    	this.sendError(io, errorCode, errorCode, e.message, e.errContext);
	    	throw e;
		}		
	};

	var importData = function(ctx, io){
		var upload = require('net/http/upload');
		if(upload.isMultipartContent()){
			try{
				var files = upload.parseRequest();
				var json = [];
				var self = this;
				files.forEach(function(file) {
					var uploadStatus = {
						"file": file.name,
					};
					var content = String.fromCharCode.apply(null, file.data);		
					try {
						var objectsForImport = JSON.parse(content);
						for(var i=0; i< objectsForImport.length; i++){
							this.logger.info('Inserting object ' + objectsForImport[i].boh_label);
							objectsForImport[i][self.dao.getPrimaryKey()] = self.dao.insert(objectsForImport[i], true);
						}
						uploadStatus.status="ok";
					} catch (err) {
						this.logger.error(1, err.message);
						uploadStatus.status="error";
						uploadStatus.details = err.message;
						throw err;
					} finally {
						json.push(uploadStatus);
					}
				});
				io.response.println(JSON.stringify(json));
				io.response.setStatus(io.response.OK);
			} catch(err){
				var errorCode = io.response.INTERNAL_SERVER_ERROR;
				this.logger.error(errorCode, err.message, err.errContext);
		    	this.sendError(io, errorCode, errorCode, err.message, err.errContext);
		    	throw err;
			} finally {
				io.response.flush();
				io.response.close();
			}		
			//log it's not multipart} else {
		}
	};

	var deleteData = function(cascaded, io){
		this.logger.info('Deleting multiple objects');
		try{
			var input = io.request.readInputText();
			this.logger.info('Deleting entities '+ (input || 'all'));
			var ids = null;
			if(input){
				ids = JSON.parse(input);
			}
	    	this.dao.remove(ids, cascaded);
			io.response.setStatus(io.response.NO_CONTENT);
		} catch(err){
			var errorCode = io.response.INTERNAL_SERVER_ERROR;
			this.logger.error(errorCode, err.message, err.errContext);
	    	this.sendError(io, errorCode, errorCode, err.message, err.errContext);
	    	throw err;
		} finally {
			io.response.flush();
			io.response.close();
		}
	};

	//override default GET list operation handler for this resource
	Header.prototype.cfg[""].get.handler = function(context, io){
		var limit = context.queryParams.limit;
		var offset = context.queryParams.offset;
		var sort = context.queryParams.sort || null;
		var order = context.queryParams.order || null;
		var expanded = context.queryParams.expanded || false;
		var queryByName = context.queryParams.entityName || null;
		var getByNameParam = context.queryParams.getByName || null;
		
		if(getByNameParam!==null){
			getByName.apply(this, [getByNameParam, expanded, io]);
		} else {
		    try{
				var entities = this.dao.list(limit, offset, sort, order, expanded, queryByName);
		        var jsonResponse = JSON.stringify(entities, null, 2);
		    	io.response.println(jsonResponse);      	
			} catch(e) {
	    	    var errorCode = io.response.INTERNAL_SERVER_ERROR ;
	    	    this.logger.error(errorCode, e.message, e.errContext);					
	        	this.sendError(errorCode, errorCode, e.message, e.errContext, io);
	        	throw e;
			}	
		} 		
	};

/*	Header.prototype.cfg[""].post = {
		consumes: ['application/json'],
		handler: function(context) {
			importData();
		}
	};*/

	//add mass delete for header entities	
	Header.prototype.cfg[""]["delete"] = {
		consumes: ['application/json'],
		handler: function(context, io) {
			deleteData(context.queryParams.cascaded, io);
		}	
	};	
	
	var header = new Header(headerDAO);	
	
	(function(header) {

		var request = require("net/http/request");
		var response = require("net/http/response");
		
		header.service(request, response);
		
	})(header);

})();
