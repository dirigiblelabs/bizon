/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

var generator = require('platform/generator');

function getBaseTemplate(projectName, packageName, entity){
	var baseTemplate = {
		"projectName":projectName,
		"packageName":packageName,
	  	"fileName": entity.label.replace(/\s+/g, '_')
	};
	baseTemplate.columns = [];	
	if(entity.properties){
		for(var j=0; j< entity.properties.length; j++){
			var prop = entity.properties[j];
			if(!prop.name)
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
	if(!entity.dsGenEnabled)
		return;
	template.templateType = 'table';
	template.fileName = entity.table + '.table';
	console.log('[Table Template Source]:' + template);
	return worker.generate(template);
}

function generateService(entity, template, worker){
	if(!entity.svcGenEnabled)
		return;
	template.templateType = "js_database_crud";
	template.tableName = entity.table;			
	template.fileName = entity.svcName + '.js';
	template.tableType = "table";	
	template.columns = template.columns.map(function(column){
		column.visible = column.boi_visible || true;	
		return column;
	});	
	console.log('[Service Template Source]:' + template);
	return worker.generate(template);
}

function generateUIForEntity(entity, template, worker){
	if(!entity.uiGenEnabled)
		return;
	template.templateType = "list_and_manage";
	template.pageTitle = entity.uiTitle || entity.name;
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
	var dataType = entity.idType || 'INTEGER';
	return {
		name: entity.idName || 'id',	
		type: dataType,
		primaryKey: true,	
		length: entity.size || lengthBySQLType(dataType),
		notNull: true,
		defaultValue: defaultValueBySQLType(dataType),
	};
}

//Prepare a JSON object for insert into DB
function createSQLEntity(item) {
	var persistentItem = {
		length: item.size || 0,
		notNull: item.required || true,
		primaryKey: false,
		defaultValue: item.defaultValue || ''
	};
	persistentItem.name = item.name.replace(/\s+/g, '_');	
	persistentItem.type = item.type;//stringToCodeItemTypeMapping(item.type);
	if(!persistentItem.length){
		if(item.type=== 'VARCHAR'){
			persistentItem.length = 255;
		}
		//TODO: add default lengths for all relevant sql types
	}
	if(persistentItem.defaultValue === undefined){
		persistentItem.defaultValue = '';
	}	
	console.debug("Transformation to DB JSON object finished: " + persistentItem);
	return persistentItem;
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


//Web Service API

require('arestme/http').get()
.addResourceHandler("templates","get", function(ctx, io){
	try{
	    var category = ctx.queryParams.category;
		if(category){
			var templateIds = Object.keys(TEMPLATE_CATEGORY).map(function(key){
				return TEMPLATE_CATEGORY[key];
			});			
			if(templateIds.indexOf(category)<0){
				this.sendError(400, 'Illegal value for query parameter category['+category+']. Must be one of ' + templateIds);
				return;    		
			}
		}		
		var _templates = listTemplates(category);	
		var jsonResponse = JSON.stringify(_templates, null, 2);
	    io.response.println(jsonResponse);
    } catch(err) {
    	this.sendError(500, err.message);
    }
})
.addResourceHandler("","post", function(ctx, io){
	try{
		//read, parse and validate input
		var input = io.request.readInputText();
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
					this.sendError(500, err.message);
					return;
				}						    				
			}
    	}  else {
			this.sendError(400, 'No input data for build operation provided');
			return;
		}
    } catch(err) {
    	this.sendError(500, err.message);
    }
}).service();

})();
