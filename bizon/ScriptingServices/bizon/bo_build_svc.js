/* globals $ */
/* eslint-env node, dirigible */

var request = require('net/http/request');
var response = require('net/http/response');
var generator = require('platform/generator');

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
	    var ds_worker, svc_worker, web_worker;
	    
	    if(buildRequest && buildRequest.entities){
	    
	    	for(var i=0; i< buildRequest.entities.length; i++){
	    		var entity = buildRequest.entities[i];
	    		var baseTemplate = getBaseTemplate(buildRequest.projectName, buildRequest.packageName, entity);
	    		var template = JSON.parse(JSON.stringify(baseTemplate));//copy
	    		try{	
		    		if(buildRequest.ds === true){
		    			if(!ds_worker)
		    				ds_worker = generator.getWorker(generator.WORKER_CATEGORY_DATA_STRUCTURES);
//	    				var generatorInput = JSON.parse(JSON.stringify(template));		    				
		    			generateDataStructure(entity, template, ds_worker);
	    			}
	    			if(buildRequest.svc === true){
		    			if(!svc_worker)
		    				svc_worker = generator.getWorker(generator.WORKER_CATEGORY_SCRIPTING_SERVICES);
//	    				var generatorInput = JSON.parse(JSON.stringify(template));			    				
		    			generateService(entity, template, svc_worker);	    			
	    			}
	    			if(buildRequest.web === true){
		    			if(!web_worker)
		    				web_worker = generator.getWorker(generator.WORKER_CATEGORY_WEB_CONTENT_FOR_ENTITY);
//		    			var generatorInput = JSON.parse(JSON.stringify(template));
		    			generateUIForEntity(entity, template, web_worker);	    			
	    			}				
				} catch(err){
				    response.setStatus(500);
				    console.error(err.message || err);
				    console.error(err.stack);
				    response.println('{"err": '+(err.message || err)+'}');
					response.flush();
					response.close();
					return;
				}						    				
			}
    	}  else {
    		response.setStatus(400);
    		console.error('No input data for build operation provided');
    		response.println('{"err":"No input data for build operation provided"}');
			response.flush();
			response.close();
			return;    		
		}
		
	}

	response.flush();
	response.close();

};


function getBaseTemplate(projectName, packageName, entity){
	var baseTemplate = {
		"projectName":projectName,
		"packageName":packageName,
	  	"fileName": entity.boh_name.replace(/\s+/g, '_')
	};
	baseTemplate.columns = [];	
	if(entity.properties){
		for(var j=0; j< entity.properties.length; j++){
			var prop = entity.properties[j];
			prop = createSQLEntity(prop);
			baseTemplate.columns.push(prop);
		}
	}
	var id = createEntityIDColumnDef(entity);
	baseTemplate.columns.push(id);		
	return baseTemplate;
}

function generateDataStructure(entity, template, worker){
	if(!entity.boh_ds_gen_enabled)
		return;
	template.templateType = 'table';
	template.fileName = entity.boh_table + '.table';
	console.log('[Table Template Source]:' + template);
	return worker.generate(template);
}

function lengthBySQLType(type){
	if(type === 2){
		return 255;
	} 
	return 0;
}

function defaultValueBySQLType(type){
	if(2 === type){
		return '';
	} 
	return 0;
}

function createEntityIDColumnDef(entity){
	var id_type = 'INTEGER';//TODO: Fix this
	return {
		name: entity.boh_id_name || 'id',	
		type: id_type || 'INTEGER',
		primaryKey: true,	
		length: entity.boi_length || lengthBySQLType(id_type),
		notNull: true,
		defaultValue: defaultValueBySQLType(id_type),
	};
}

function generateService(entity, template, worker){
	if(!entity.boh_svc_gen_enabled)
		return;
	template.templateType = "js_db_crud";
	template.tableName = entity.boh_table;			
	template.fileName = entity.boh_svc_name + '.js';
	template.tableType = "table";	
	template.columns = template.columns.map(function(column){
		column.visible = column.boi_visible || true;	
		return column;
	});	
	console.log('[Service Template Source]:' + template);
	return worker.generate(template);
}

function generateUIForEntity(entity, template, worker){
	if(!entity.boh_ui_gen_enabled)
		return;
	template.templateType = "list_and_manage";
	template.pageTitle = entity.boh_ui_title || entity.boh_name;
	template.tableName = template.fileName;
	template.serviceEndpoint = '/'+template.packageName+'/'+template.fileName;	
	template.fileName = template.fileName.replace('.js','') + '.html';
	template.columns = template.columns.map(function(column){
		column.label = column.boi_label || column.name;
		column.widgetType = column.boi_widgetType || 'text';
		column.size = column.boi_size || column.label.length;
		return column;
	});	
	console.info('[UI Template Source]:' + template);
	return worker.generate(template);
};

//Prepare a JSON object for insert into DB
function createSQLEntity(item) {
	var persistentItem = {
		length: item.boi_length || 0,
		notNull: item.boi_null || true,
		primaryKey: false,
		defaultValue: item.boi_default || ''
	};
	persistentItem.name = item.boi_name.replace(/\s+/g, '_');
	persistentItem.type = stringToCodeItemTypeMapping(item.boi_type);
	if(persistentItem.length === 0 && persistentItem.type === 'VARCHAR'){
		persistentItem.length = 255;
	}
	if(persistentItem.defaultValue === undefined){
		persistentItem.defaultValue = '';
	}	
	console.debug("Transformation to DB JSON object finished: " + persistentItem);
	return persistentItem;
};

function stringToCodeItemTypeMapping(typeIndex) {
	if(!isNaN(parseInt(typeIndex))){
		return typeIndex;
	}
	if(typeIndex === 'Integer')
		return 'INTEGER';
	if(typeIndex === 'String')
		return 'VARCHAR';
	if(typeIndex === 'Boolean')
		return 'TINYINT';
	if(typeIndex === 'Relationship')
		return 'OBJECT';
}

