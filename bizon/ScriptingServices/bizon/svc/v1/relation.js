/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

	var relationDAO = require("bizon/lib/relation_dao");
	var request = require("net/http/request");
	var response = require("net/http/response");
	var xss = require("utils/xss");	
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
						this.get(urlParameters.id, urlParameters.expanded);
					} else if(urlParameters.metadata){
						this.metadata();
					} else if(urlParameters.count){
						this.count();
					} else if(urlParameters.list){
						this.query(urlParameters.list.limit, urlParameters.list.offset, urlParameters.list.sort, urlParameters.list.order, urlParameters.srcId, urlParameters.targetId);
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
	
	restUtils.asRestAPI.call(api.prototype, relationDAO);
	
	api.prototype.query = function(limit, offset, sort, order, sourceId, targetId){

		if (offset === undefined || offset === null) {
			offset = 0;
		} else if(isNaN(parseInt(offset,10)) || offset<0) {
			$log.error(1, "Invallid offset parameter: " + offset + ". Must be a positive integer.");
			restUtils.printError(response.BAD_REQUEST, 1, "Invallid offset parameter: " + offset + ". Must be a positive integer.");
			return;
		}

		if (limit === undefined || limit === null) {
			limit = 0;
		}  else if(isNaN(parseInt(limit,10)) || limit<0) {
			$log.error(1, "Invallid limit parameter: " + limit + ". Must be a positive integer.");
			restUtils.printError(response.BAD_REQUEST, 1, "Invallid limit parameter: " + limit + ". Must be a positive integer.");
			return;			
		}
		if (sort === undefined) {
			sort = null;
		} else if( sort !== null && this.validSortPropertyNames.indexOf(sort)<0){
			$log.error(1, "Invalid sort by property name: " + sort);
			restUtils.printError(response.BAD_REQUEST, 1, "Invalid sort by property name: " + sort);
			return;
		}
		if (order === undefined) {
			order = null;
		} else if(order!==null){
			if(sort === null){
				$log.error(1, "Parameter order is invalid without paramter sort to order by.");
				restUtils.printError(response.BAD_REQUEST, 1, "Parameter order is invalid without paramter sort to order by.");
				return;
			} else if(['asc', 'desc'].indexOf(order.trim().toLowerCase())){
				$log.error( 1, "Invallid order parameter: " + order + ". Must be either ASC or DESC.");					
				restUtils.printError(response.BAD_REQUEST, 1, "Invallid order parameter: " + order + ". Must be either ASC or DESC.");
				return;
			}
		}
		if(sourceId === undefined)
			sourceId = null;
		if(targetId === undefined)
			targetId = null;
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
		
		//get primary keys (one primary key is supported!)
		var idParameter = relationDAO.getPrimaryKey();
		var urlParameters = restUtils.urlParametersDigest(idParameter);
		if(urlParameters){
			var srcId = xss.escapeSql(request.getParameter('srcId'));
			urlParameters.srcId = srcId;
			var targetId = xss.escapeSql(request.getParameter('targetId'));	
			urlParameters.targetId = targetId;
			relationREST.dispatch(urlParameters);		
		}	
		// flush and close the response
		response.flush();
		response.close();
		
	})(request, response);

})();
