/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";
	
	var arester = require("arestme/arester");

	var relationDAO = require("bizon/lib/relation_dao");
	var Relation = arester.asRestAPI(relationDAO);
	Relation.prototype.logger.ctx = "Relation Svc";
	Relation.prototype.validSortPropertyNames = ['bor_name'];
	
	//override default GET list operation handler for this resource
	Relation.prototype.cfg[""].get.handler = function(context, io){
		var limit = context.queryParams.limit || null;	
		var offset = context.queryParams.offset || null;
		var sort = context.queryParams.sort || null;
		var order = context.queryParams.order || null;
		var sourceId = context.queryParams.srcId || null;
		var targetId = context.queryParams.targetId || null;		
	    try{
			var items = relationDAO.list(limit, offset, sort, order, sourceId, targetId);
	        var jsonResponse = JSON.stringify(items, null, 2);
	    	io.response.println(jsonResponse);      	
		} catch(e) {
    	    var errorCode = io.response.INTERNAL_SERVER_ERROR;
    	    this.logger.error(errorCode, e.message, e.errContext);
        	this.sendError(errorCode, errorCode, e.message, e.errContext, io);
        	throw e;
		}	
	};

	var relation = new Relation(relationDAO);	
	
	(function(relation) {

		var request = require("net/http/request");
		var response = require("net/http/response");
		
		relation.service(request, response);
		
	})(relation);
	
})();
