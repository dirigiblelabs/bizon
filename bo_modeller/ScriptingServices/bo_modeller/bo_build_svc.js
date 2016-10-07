/* globals $ */
/* eslint-env node, dirigible */

var request = require('net/http/request');
var response = require('net/http/response');
var xss = require("utils/xss");
var generator = require('gen/generator');

handleRequest();

function handleRequest() {

	response.setContentType("application/json; charset=UTF-8");
	response.setCharacterEncoding("UTF-8");
	response.setStatus(response.OK);

	var method = request.getMethod().toUpperCase();

	if('POST' !== method){
		response.setStatus(400);
		response.println('Not suported method for this resource: ' + method);
		response.flush();
		response.close();
		return;
	} else {
		//read, parse and validate input
		var input = request.readInputText();
	    var buildRequest = JSON.parse(input);
	    
	    if(buildRequest && buildRequest.entities){
	    
	    	for(var i=0; i< buildRequest.entities.length; i++){
	    		var entity = buildRequest.entities[i];
	    		if(buildRequest.ds === true){
	    			try{
	    				buildDataStructures(buildRequest.projectName, buildRequest.packageName, entity);
					} catch(err){
					    response.setStatus(500);
					    response.println('{"err": '+(err.message || err)+'}');
						response.flush();
						response.close();
						return;
					}						    				
    			}				
			}
    	}  else {
    		response.setStatus(400);
    		response.println('{"err":"No input data for build operation provided"}');
			response.flush();
			response.close();
			return;    		
		}
		
	}

	response.flush();
	response.close();

};

function buildDataStructures(project, packageName, entity){
	var tableDef = {
	  "templateType":"table",
	  "fileName": entity.boh_name.replace(/\s+/g, ''),
	  "projectName":project,
	  "packageName":packageName
	};
	tableDef.columns = [];
	if(entity.properties){
		for(var j=0; j< entity.properties.length; j++){
			var prop = entity.properties[j];
			tableDef.columns.push({
				  "name": prop.boi_name,
				  "type": prop.boi_type,
			      "length": prop.boi_length,
			      "notNull": prop.boi_null,
			      "primaryKey": prop.boi_pk,
			      "defaultValue": prop.boi_default||'null'
			  });
		}
	}
	console.info(tableDef);
	var worker = generator.getWorker(generator.WORKER_CATEGORY_DATA_STRUCTURES);
	return worker.generate(tableDef);
};
