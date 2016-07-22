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
	var id = xss.escapeSql(request.getParameter(idParameter)) || request.getAttribute("path");
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
		if (method === 'POST') {
			// create
			console.info("POST entity for create");
			entityBo_items.createBo_items();
		} else if (method === 'GET') {
			// read
			if (id) {
				console.info("GET entity by id %s", id);
				entityBo_items.readBo_itemsEntity(id, true);
			} else if (count !== null) {
				entityBo_items.countBo_items();
			} else if (metadata !== null) {
				entityBo_items.metadataBo_items();
			} else {
				console.info("GET Item entities");
				entityBo_items.readBo_itemsList(null, limit, offset, sort, desc, true);
			}
		} else if (method === 'PUT') {
			// update
			console.info("PUT Item entities for update");
			entityBo_items.updateBo_items();    
		} else if (method === 'DELETE') {
			// delete
			console.info("DELETE Item entity by id %s", id);
			if(entityBo_items.isInputParameterValid(idParameter) || (request.getAttribute("path") && request.getAttribute("path")!==null)){			
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
