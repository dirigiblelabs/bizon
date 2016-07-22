/* globals $ */
/* eslint-env node, dirigible */

var entityBo_header = require('bo_modeller/bo_header_lib');
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
	var idParameter = entityBo_header.getPrimaryKey();
	
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
	
	if(!entityBo_header.hasConflictingParameters(id, count, metadata)) {
		// switch based on method type
		if (method === 'POST') {
			// create
			console.info("POST entity for create");
			entityBo_header.createBo_header();
		} else if (method === 'GET'){
			// read
			if (id) {
				console.info("GET entity by id %s", id);
				entityBo_header.readBo_headerEntity(id, true);
			} else if (count !== null) {
				entityBo_header.countBo_header();
			} else if (metadata !== null) {
				entityBo_header.metadataBo_header();
			} else {
				console.info("GET entities");
				entityBo_header.readBo_headerList(limit, offset, sort, desc, true);
			}
		} else if (method === 'PUT') {
			// update
			console.info("PUT entity by id %s for update", id);
			entityBo_header.updateBo_header(true);    
		} else if (method === 'DELETE') {
			// delete
			console.info("DELETE entity by id %s", id);
			if(entityBo_header.isInputParameterValid(idParameter) || (request.getAttribute("path") && request.getAttribute("path") != null) ){
				entityBo_header.deleteBo_header(id, true);
			}
		} else {
			entityBo_header.printError(response.BAD_REQUEST, 4, "Invalid HTTP Method", method);
		}
	}
	
	// flush and close the response
	response.flush();
	response.close();
}
