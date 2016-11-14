/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

	var itemDAO = require("bizon/lib/item_dao");
	var request = require("net/http/request");
	var response = require("net/http/response");
	var restUtils = require("bizon/svc/rest/utils");
	
	var $log = {
		error: function(errCode, errMessage, errContext){
			console.error('['+errCode+']: '+ errMessage);
		    if (errContext !== undefined && errContext !== null) {
		    	console.error(JSON.stringify(errContext));
		    }
		}
	};
	
	//the API skeleton
	var api = function(){	
		this.idPropertyName = 'boi_id';
		this.validSortPropertyNames = ['boi_id','boi_name','boi_boh_name','boi_column','boi_type_name','boi_type','boi_length','boi_null','boi_default'];
		return this;
	};
	//mixin
	restUtils.asRestAPI.call(api.prototype, itemDAO);
	
	//override default GET list operation handler for this resource
	api.prototype.cfg[""].get.handler = function(context){
		var headerId = context.pathParams.headerId;	
		var limit = context.queryParams.limit;	
		var offset = context.queryParams.offset;
		var sort = context.queryParams.sort;
		var order = context.queryParams.order;
	    try{
			var items = this.getDAO().list(headerId, limit, offset, sort, order);
	        var jsonResponse = JSON.stringify(items, null, 2);
	    	response.println(jsonResponse);      	
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR ;
    	    $log.error(errorCode, e.message, e.errContext);					
        	restUtils.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}
	};

	var itemREST = new api(itemDAO);//ready to serve requests to this resource
	
	(function(request, response) {
		response.setContentType("application/json; charset=UTF-8");
		response.setCharacterEncoding("UTF-8");
		
		itemREST.service.apply(this);
		
		response.flush();
		response.close();
		
	})(request, response);

})();
