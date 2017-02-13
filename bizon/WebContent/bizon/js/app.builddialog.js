(function(angular){
"use strict";

angular.module('businessObjects')
.controller('BuildDialogCtrl', ['masterDataSvc', 'BuildService', '$scope', '$log', '$stateParams', '$window', function(masterDataSvc, BuildService, $scope, $log, $stateParams, $window) {

	this.cfg = {};
	this.slider = {
	  options: {
	  	showTicksValues: true,
	    stepsArray: [
	      {value: 1, legend: 'Data'},
	      {value: 2, legend: 'Service'},
	      {value: 3, legend: 'UI'}
	    ]
	  }
	};
	var self = this;
	
	BuildService.listTemplates().$promise
		.then(function(templates){
			self.templates = templates;
			self.cfg.templates = {};
			//set defualt templates
			if(templates.ds){
				self.cfg.templates.ds = templates.ds.find(function(tmpl){
					return tmpl.name === 'ds_table';
				});
			}
			if(templates.svc){
				self.cfg.templates.svc = templates.svc.find(function(tmpl){
					return tmpl.name === 'svc_js_crud';
				});
			}
			if(templates.ds){
				self.cfg.templates.ui = templates.ui.find(function(tmpl){
					return tmpl.name === 'ui_list_and_manage';
				});
			}			
		})
		.catch(function(response){
			$log.error(response);
		});

	this.build = function(){
		var entities = masterDataSvc.getLoadedData();
		try{
			var addDataStructures = self.slider.value >= 1;
			var addScriptingServices = self.slider.value >= 2;
			var addWebContent = self.slider.value === 3;

			var buildTemplate = getBuildTemplate(self.cfg, entities, addDataStructures, addScriptingServices, addWebContent);
			BuildService.build(buildTemplate);
		} catch(err){
			$log.debug('The requested application path ' + $window.location.href + " is not valid.");
			$stateParams.message = {
				text: $window.location.href + ' is not valid application path. Check the URL and try again.',
				type: 'alert-danger'
			};
		}finally{
			$scope.$close();
		}
	};

	this.cancel = function(){
		$scope.$dismiss();
	};

	function getBuildTemplate(buildTemplate, entities, addDataStructures, addScriptingServices, addWebContent) {
		if (addDataStructures) {
			addDataStructuresTemplate(buildTemplate, entities);
		}
		if (addScriptingServices) {
			addScriptingServicesTemplate(buildTemplate, entities);
		}
		if (addWebContent) {
			addWebContentTemplate(buildTemplate, entities);
		}
		return buildTemplate;
	}

	function addDataStructuresTemplate(template, entities) {
		// Add DataStructures Generation
		template.dataStructures = [];
		for (var i = 0 ; i < entities.length; i ++) {
			var dataStructure = {
				'fileName': entities[i].boh_table.toLowerCase() + '.table',
				'columns': []
			}
			for (var j in entities[i].properties) {
				var nextColumn = entities[i].properties[j];
				dataStructure.columns.push({
					'name': nextColumn.boi_name.toUpperCase(),
		            'type': nextColumn.boi_type.toUpperCase(),
		            'length': nextColumn.boi_length,
		            'notNull': !nextColumn.boi_null,
		            'key': nextColumn.boi_name === entities[i].boh_id_name,
		            'defaultValue': ''
		         });
			}
			template.dataStructures.push(dataStructure);
		}
	}

	function addScriptingServicesTemplate(template, entities) {
		// Add ScriptingServices Generation
		template.scriptingServices = [];
		for (var i = 0 ; i < entities.length; i ++) {
			var scriptingService = {
				'fileName': entities[i].boh_svc_name + '.js',
				'tableName': entities[i].boh_table.toUpperCase(),
				'columns': []
			};
			for (var j in entities[i].properties) {
				var nextColumn = entities[i].properties[j];
				scriptingService.columns.push({  
		    		'name': nextColumn.boi_name.toUpperCase(),
		            'type': nextColumn.boi_type.toUpperCase(),
		            'key': nextColumn.boi_name === entities[i].boh_id_name
		         });
			}
			template.scriptingServices.push(scriptingService);
		}
	}

	function addWebContentTemplate(template, entities) {
		// Add WebContent Generation
		var widgetsMapping = {
			'DATE': 'date',
			'VARCHAR': 'textarea',
			'SMALLINT': 'integer',
			'INTEGER': 'integer', // TODO Add more integer-compliant types 
			'FLOAT': 'float',
			'DROPDOWN': 'dropdown', // TODO What about the dropdown & list?
			'LIST': 'list'
		}
		template.webContent = [];
		for (var i = 0 ; i < entities.length; i ++) {
			var web = {
				'fileName': entities[i].boh_svc_name + '.html',
				'pageTitle': entities[i].boh_ui_title,
				'serviceFileName': '../../js/' + template.packageName + '/' + template.scriptingServices[i].fileName,
				'columns': []
			};
			for (var j in entities[i].properties) {
				var nextColumn = entities[i].properties[j];
				web.columns.push({
					'name': nextColumn.boi_name.toLowerCase(),
		            'label': nextColumn.boi_label ? nextColumn.boi_label : nextColumn.boi_name,
		            'widgetType': widgetsMapping[nextColumn.boi_type],
		            'key': nextColumn.boi_name === entities[i].boh_id_name,
		            'visible': true
		         });
			}
			template.webContent.push(web);
		}
	}
}]);
})(angular);
