/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

	var relationDAO = require("bizon/lib/relation_dao");
	var request = require("net/http/request");
	var response = require("net/http/response");
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
		this.idPropertyName = 'bor_id';
		this.validSortPropertyNames = ['bor_name'];
		return this;
	};
	
	restUtils.asRestAPI.call(api.prototype, relationDAO);
	
	//override default GET list operation handler for this resource
	api.prototype.cfg[""].get.handler = function(context){
		var limit = context.queryParams.limit || null;	
		var offset = context.queryParams.offset || null;
		var sort = context.queryParams.sort || null;
		var order = context.queryParams.order || null;
		var sourceId = context.queryParams.srcId || null;
		var targetId = context.queryParams.targetId || null;		
	    try{
			var items = relationDAO.list(limit, offset, sort, order, sourceId, targetId);
	        var jsonResponse = JSON.stringify(items, null, 2);
	    	response.println(jsonResponse);      	
		} catch(e) {
    	    var errorCode = response.INTERNAL_SERVER_ERROR;
    	    $log.error(errorCode, e.message, e.errContext);
        	restUtils.printError(errorCode, errorCode, e.message, e.errContext);
        	throw e;
		}	
	};	
	
	var relationREST = new api(relationDAO);
	
	(function(request, response) {
		response.setContentType("application/json; charset=UTF-8");
		response.setCharacterEncoding("UTF-8");
		
		relationREST.service();		

		// flush and close the response
		response.flush();
		response.close();
		
	})(request, response);

})();
