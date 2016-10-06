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
	    var items = JSON.parse(input);
	    
	    if(items){
	    
	    	for(var i=0; i< items.length; i++){
				var tableDef = {
				  "templateType":"table",
				  "fileName": items[i].boh_name.replace(/\s+/g, ''),
				  "projectName":"testproject",
				  "packageName":"mypackage1"
				};
				tableDef.columns = [];
				if(items[i].properties){
					for(var j=0; j< items[i].properties.length; j++){
						var prop = items[i].properties[j];
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
				try{	    		
					worker.generate(tableDef);				
				} catch(err){
				    response.setStatus(500);
				    response.println('{"err": '+(err.message || err)+'}');
					response.flush();
					response.close();
					return;
				}					
			}
			//response.println('{"status":"ok"}');
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
