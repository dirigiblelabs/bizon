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
		    if (errContext !== null) {
		    	console.error(JSON.stringify(errContext));
		    }
		}
	};
	
	var api = function(){
	
		this.idPropertyName = 'boi_id';
		this.validSortPropertyNames = ['boi_id','boi_name','boi_boh_name','boi_column','boi_type_name','boi_type','boi_length','boi_null','boi_default'];
	
		this.dispatch = function(urlParameters){
			var method = request.getMethod().toUpperCase();
			console.log('Dispatching operation request for HTTP Verb['+ method +'] and URL parameters: ' + urlParameters);
	
			if('POST' === method){
				this.create();
			} else if('PUT' === method){
				this.update();
			} else if('DELETE' === method){
				this.remove(urlParameters.id);
			} else if('GET' === method){
				if(urlParameters){
					if(urlParameters.id){
						this.get(urlParameters.id);
					} else if(urlParameters.metadata){
						this.metadata();
					} else if(urlParameters.count){
						this.count();
					} else if(urlParameters.list){
						this.query(urlParameters.list.headerId, urlParameters.list.limit, urlParameters.list.offset, urlParameters.list.sort, urlParameters.list.order);
					}
				} else {
					this.query();
				}
			} else {
				$log.error(4, "Invalid HTTP Method", method);
				restUtils.printError(response.BAD_REQUEST, 4, "Invalid HTTP Method", method);
			}
		};
		return this;
	};	
	
	restUtils.asRestAPI.call(api.prototype, itemDAO);
	
	var itemREST = new api(itemDAO);	
	
	(function(request, response) {
		response.setContentType("application/json; charset=UTF-8");
		response.setCharacterEncoding("UTF-8");
		
		//get primary keys (one primary key is supported!)
		var idParameter = itemDAO.getPrimaryKey();
		var urlParameters = restUtils.urlParametersDigest(idParameter);
		if(urlParameters){
			itemREST.dispatch(urlParameters);		
		}	
		// flush and close the response
		response.flush();
		response.close();
		
	})(request, response);

})();
