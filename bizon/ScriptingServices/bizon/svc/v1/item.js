/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";
	
	var arester = require("arestme/arester");

	var itemDAO = require("bizon/lib/item_dao");
	var Item = arester.asRestAPI(itemDAO);
	Item.prototype.logger.ctx = "Item Svc";
	Item.prototype.validSortPropertyNames = ['boi_id','boi_name','boi_boh_name','boi_column','boi_type_name','boi_type','boi_length','boi_null','boi_default'];
	
	//override default GET list operation handler for this resource
	Item.prototype.cfg[""].get.handler = function(context, io){
		var headerId = context.pathParams.headerId;	
		var limit = context.queryParams.limit;	
		var offset = context.queryParams.offset;
		var sort = context.queryParams.sort;
		var order = context.queryParams.order;
	    try{
			var items = this.dao.list(headerId, limit, offset, sort, order);
	        var jsonResponse = JSON.stringify(items, null, 2);
	    	io.response.println(jsonResponse);      	
		} catch(e) {
    	    var errorCode = io.response.INTERNAL_SERVER_ERROR ;
    	    this.logger.error(errorCode, e.message, e.errContext);					
        	this.sendError(io, errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}
	};
	
	var item = new Item(itemDAO);	
	
	(function(item) {

		var request = require("net/http/request");
		var response = require("net/http/response");
		
		item.service(request, response);
		
	})(item);

})();
