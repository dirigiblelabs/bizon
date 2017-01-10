/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

var request = require('net/http/request');
var response = require('net/http/response');
var xss = require("utils/xss");
var generator = require('platform/generator');


var TEMPLATE_CATEGORY = Object.freeze({"DATSTRUCTURE":"ds", "SERVICE":"svc", "UI":"ui"});
var templates = {
	"ds": [{
		"name": "ds_table", 
		"label": "Relational Database Table", 
		"description": "Relational database table template",
		"templateAdapter": generateDataStructure
	}],
	"svc": [{
		"name": "svc_js_crud", 
		"label": "JavaScript Entity Service on Table",
		"description": "JavaScript RESTful entity service on a relational database table", 
		"templateAdapter": generateService,
		"baseTemplate": "ds"
	}],	
	"ui": [{
		"name": "ui_list_and_manage", 
		"label": "List and Manage Entity",
		"description": "List and manage entity page based on Bootstrap and AngularJS", 
		"templateAdapter": generateUIForEntity,
		"baseTemplate": "svc"
	}]
};

(function(request, response) {
		
	response.setContentType("application/json; charset=UTF-8");
	response.setCharacterEncoding("UTF-8");
	response.setStatus(response.OK);

	var method = request.getMethod().toUpperCase();

	if('GET' === method){
		var path = request.getAttribute("path");
		if(path === 'templates'){
			var category = xss.escapeSql(request.getParameter('category'));
			if(category){
				var templateIds = Object.keys(TEMPLATE_CATEGORY).map(function(key){
					return TEMPLATE_CATEGORY[key];
				});			
				if(templateIds.indexOf(category)<0){
					response.setStatus(400);
		    		console.error('Illegal value for query parameter category['+category+']. Must be one of ' + templateIds);
		    		response.println('{"err":"Illegal value for query parameter category['+category+']. Must be one of ' + templateIds+'"}');
					response.flush();
					response.close();
					return;    		
				}
			}
			
			var _templates = listTemplates(category);	
			var jsonResponse = JSON.stringify(_templates, null, 2);
	        response.println(jsonResponse);
		} else {
		    response.setStatus(400);
    		console.error('No handler for this resource path['+path+']');
    		response.println('{"err":"No handler for this resource path['+path+']"}');
			response.flush();
			response.close();
			return;    		
		}	
	} else if('POST' === method){
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
		
	} else{
		response.setStatus(400);
		response.println('Not suported HTTP method['+method+'] for this resource');
		response.flush();
		response.close();
		return;
	}

	response.flush();
	response.close();
	
})(request, response);



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
			if(!prop.boi_name)
				continue;
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
	var dataType = entity.boh_id_datatype_code || 'INTEGER';
	return {
		name: entity.boh_id_name || 'id',	
		type: dataType,
		primaryKey: true,	
		length: entity.boi_length || lengthBySQLType(dataType),
		notNull: true,
		defaultValue: defaultValueBySQLType(dataType),
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
	template.fileName = template.fileName.replace('.js','.html');
	template.columns = template.columns.map(function(column){
		column.label = column.boi_label || column.name;
		column.widgetType = column.boi_widgetType || 'text';
		column.size = column.boi_size || column.label.length;
		return column;
	});	
	console.info('[UI Template Source]:' + template);
	return worker.generate(template);
}

//Prepare a JSON object for insert into DB
function createSQLEntity(item) {
	var persistentItem = {
		length: item.boi_length || 0,
		notNull: item.boi_null || true,
		primaryKey: false,
		defaultValue: item.boi_default || ''
	};
	persistentItem.name = item.boi_name.replace(/\s+/g, '_');	
	persistentItem.type = item.boi_type;//stringToCodeItemTypeMapping(item.boi_type);
	if(!persistentItem.length){
		if(item.boi_type=== 'VARCHAR'){
			persistentItem.length = 255;
		}
		//TODO: add default legnths for all relevant sql types
	}
	if(persistentItem.defaultValue === undefined){
		persistentItem.defaultValue = '';
	}	
	console.debug("Transformation to DB JSON object finished: " + persistentItem);
	return persistentItem;
}

function stringToCodeItemTypeMapping(typeIndex) {
	if(!isNaN(parseInt(typeIndex, 10))){
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

//TODO: provide for list of categories too
function listTemplates(category){	
	var _templates = {};
	if(category && Object.keys(templates).indexOf(category)>-1){
		_templates[category] = templates[category];
	} else{
		_templates = templates;
	}
	var _keys = Object.keys(_templates);
	for(var i=0;i<_keys.length;i++){
		_templates[_keys[i]] = _templates[_keys[i]].map(function(tmpl){
			return {
				"name": tmpl.name,
				"label": tmpl.label,			
				"description": tmpl.description,
			};
		});
	}
	return _templates;
}
})();