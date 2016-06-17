/* globals $ */
/* eslint-env node, dirigible */

var entityBo_items = require('bo_modeller/bo_item_lib');
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
	
	//get primary keys (one primary key is supported!)
	var idParameter = entityBo_items.getPrimaryKey();
	
	// retrieve the id as parameter if exist 
	var id = xss.escapeSql(request.getParameter(idParameter));
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
	
	if(!entityBo_items.hasConflictingParameters(id, count, metadata)) {
		// switch based on method type
		if ((method === 'POST')) {
			// create
			entityBo_items.createBo_items();
		} else if ((method === 'GET')) {
			// read
			if (id) {
				entityBo_items.readBo_itemsEntity(id);
			} else if (count !== null) {
				entityBo_items.countBo_items();
			} else if (metadata !== null) {
				entityBo_items.metadataBo_items();
			} else {
				entityBo_items.readBo_itemsList(limit, offset, sort, desc);
			}
		} else if ((method === 'PUT')) {
			// update
			entityBo_items.updateBo_items();    
		} else if ((method === 'DELETE')) {
			// delete
			if(entityBo_items.isInputParameterValid(idParameter)){
				entityBo_items.deleteBo_items(id);
			}
		} else {
			entityBo_items.printError(response.BAD_REQUEST, 4, "Invalid HTTP Method", method);
		}
	}
	
	// flush and close the response
	response.flush();
	response.close();
}