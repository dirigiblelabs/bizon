/* globals $ */
/* eslint-env node, dirigible */

var entityBo_flat_view = require('bo_modeller/bo_flat_view_lib');
var request = require("net/http/request");
var response = require("net/http/response");
var xss = require("utils/xss");

handleRequest();

function handleRequest() {
	
	response.setContentType("application/json; charset=UTF-8");
	response.setCharacterEncoding("UTF-8");
	
	// get method type
	var method = request.getMethod();
	method = method.toUpperCase();
	
	// retrieve the id as parameter if exist 
	var count = xss.escapeSql(request.getParameter('count'));
	var metadata = xss.escapeSql(request.getParameter('metadata'));
	var sort = xss.escapeSql(request.getParameter('sort'));
	var limit = xss.escapeSql(request.getParameter('limit'));
	var offset = xss.escapeSql(request.getParameter('offset'));
	var desc = xss.escapeSql(request.getParameter('desc'));
	
	if (limit === null) {
		limit = 100;
	}
	if (offset === null) {
		offset = 0;
	}
	
	if(!entityBo_flat_view.hasConflictingParameters(null, count, metadata)) {
		// switch based on method type
		if ((method === 'GET')) {
			// read
			if (count !== null) {
				entityBo_flat_view.countBo_flat_view();
			} else if (metadata !== null) {
				entityBo_flat_view.metadataBo_flat_view();
			} else {
				entityBo_flat_view.readBo_flat_viewList(limit, offset, sort, desc);
			}
		} else {
			// create, update, delete
			entityBo_flat_view.printError(response.METHOD_NOT_ALLOWED, 4, "Method not allowed"); 
		}
	}
	
	// flush and close the response
	response.getWriter().flush();
	response.getWriter().close();
}