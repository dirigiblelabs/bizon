/* globals $ */
/* eslint-env node, dirigible */
"use strict";


var headerDAO = require("bizon/lib/header_dao").get();
var DataService = require("arestme/data_service").DataService;
new DataService(headerDAO).service();

/*var importData = function(ctx, io){
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
						this.logger.info('Inserting object ' + objectsForImport[i].label);
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
};*/
