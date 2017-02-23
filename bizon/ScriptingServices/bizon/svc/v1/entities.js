/* globals $ */
/* eslint-env node, dirigible */
"use strict";


var headerDAO = require("bizon/lib/entity_dao").get();
var DataService = require("arestme/data_service").DataService;

var svc = new DataService(headerDAO);
//add upload handler to this data service
var HttpController = require("arestme/http").HttpController;
HttpController.prototype.addResourceHandler.call(svc, "", "post", function(ctx, io){
	var upload = require('net/http/upload');
	try{
		var filesUpload = upload.parseRequest();
		var json = [];
		if(filesUpload!==null && filesUpload !==undefined){
			if(filesUpload.constructor!==Array)
				filesUpload = [filesUpload];
			var i=1;
			filesUpload.forEach(function(file) {
				var content, objectsForImport;
				this.logger.info('Processing file upload['+(i++)+'] of ' + filesUpload.length +': '+ file.name);
				try {
					content = String.fromCharCode.apply(null, file.loadData());
					objectsForImport = JSON.parse(content);
				} catch (err){
					this.sendError(io.response.BAD_REQUEST, err.message);
				}
				var ids = this.handlersProvider.dao.insert(objectsForImport, true);
				json = json.concat(ids);
			}.bind(this));				
		}
		io.response.println(JSON.stringify(json, null, 2));
		io.response.setStatus(io.response.OK);		
	} catch(err){
		this.logger.error(err.message, err);
    	this.sendError(io.response.INTERNAL_SERVER_ERROR, err.message);
    	throw err;
	} 
}.bind(svc), ['multipart/form-data']);
HttpController.prototype.addResourceHandler.call(svc, "", "delete", function(ctx, io){
	this.logger.info('Deleting multiple ' + this.handlersProvider.dao.orm.dbName + ' entities');
	try{
		var input = io.request.readInputText();
		if(input && input.length>0){
			var ids;
			try {
				ids = JSON.parse(input);
			} catch (err){
				this.sendError(io.response.BAD_REQUEST, err.message);
			}
			this.handlersProvider.dao.remove(ids);
		} else {
			this.handlersProvider.dao.remove();
		}
		io.response.setStatus(io.response.NO_CONTENT);
	} catch(err){
		this.logger.error(err.message, err);
    	this.sendError(io.response.INTERNAL_SERVER_ERROR, err.message);
    	throw err;
	}  
}.bind(svc));
svc.service();
