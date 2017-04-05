(function(angular){
"use strict";

angular.module('businessObjects')
.controller('BuildDialogCtrl', ['Settings', 'masterDataSvc', 'BuildService', 'PublishService', '$scope', '$log', '$stateParams', '$window', function(Settings, masterDataSvc, BuildService, PublishService, $scope, $log, $stateParams, $window) {

	this.app = Settings;
	this.cfg = {
		publishAfterBuild: Settings.publishAfterBuild,
		projectName: Settings.projectName,
		packageName: Settings.packageName
	};
	this.slider = {
	  value: 3,
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

	$scope.$$postDigest(function() {
	    $scope.$broadcast('rzSliderForceRender');
	});
	
	Settings.getTemplates()
	.then(function(templates){
		self.templates = templates;
		self.cfg.templates = {};
		//set default templates
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

	this.rememberSettings = function(){
		if(this.cfg.projectName!==undefined)
			Settings.projectName = this.cfg.projectName;
		if(this.cfg.packageName!==undefined)
			Settings.packageName = this.cfg.packageName;
		if(this.cfg.publishAfterBuild!==undefined)
			Settings.publishAfterBuild = this.cfg.publishAfterBuild;						
	};

	this.build = function(){
		var entities = masterDataSvc.getLoadedData();
		try{
			var addDataStructures = self.slider.value >= 1;
			var addScriptingServices = self.slider.value >= 2;
			var addWebContent = self.slider.value === 3;

			var buildTemplate = getBuildTemplate(self.cfg, entities, addDataStructures, addScriptingServices, addWebContent);
			BuildService.build(buildTemplate).$promise
			.then(function(){
				$log.info('App build finished successfully');
				if(self.cfg.publishAfterBuild){
					//publish
					PublishService.publish().$promise
					.then(function(){
						$log.error('projet '+self.cfg.projectName+' published');
					})
					.catch(function(err){
						$log.error('publish failed: ' + err.message);
					});
				}
			})
			.catch(function(err){
				if(err){
					$log.error('App build failed: ' + err.message + '\r\n' + err.stack);
					$stateParams.message = {
						text: 'Build request for app failed: ' + err.message,
						type: 'alert-danger'
					};				
				}
			});
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
				'fileName': entities[i].table.toLowerCase() + '.table',
				'columns': [],
			}
			for (var j in entities[i].properties) {
				var nextColumn = entities[i].properties[j];
				dataStructure.columns.push({
					'name': nextColumn.column.toUpperCase(),
		            'type': nextColumn.type.toUpperCase(),
		            'length': nextColumn.size===undefined ? 0 : nextColumn.size,
		            'notNull': nextColumn.required,
		            'primaryKey': nextColumn.isPrimaryKey,
		            'defaultValue': nextColumn.defaultValue || '',
		            'order': nextColumn.order
		         });
			}
			//sort asc by property.order
			dataStructure.columns.sort(function(next, prev){
				if(prev.order!==undefined && next.order!==undefined){
					return next.order - prev.order;
				}
				return 0;
			});
			template.dataStructures.push(dataStructure);
		}
	}

	function addScriptingServicesTemplate(template, entities) {
		// Add ScriptingServices Generation
		template.scriptingServices = [];
		for (var i = 0 ; i < entities.length; i ++) {
			var scriptingService = {
				'fileName': entities[i].svcName + '.js',
				'tableName': entities[i].table.toUpperCase(),
				'columns': []
			};
			var pkName;
			for (var j in entities[i].properties) {
				var nextColumn = entities[i].properties[j];
				if(nextColumn.isPrimaryKey)
					pkName = nextColumn.name;
				scriptingService.columns.push({  
		    		'name': nextColumn.name.toUpperCase(),
		            'type': nextColumn.type.toUpperCase(),
		            'key' : nextColumn.isPrimaryKey,
		            'order': nextColumn.order
		         });
			}
			//sort asc by property.order
			scriptingService.columns.sort(function(next, prev){
				if(prev.order!==undefined && next.order!==undefined){
					return next.order - prev.order;
				}
				return 0;
			});
/*			for (var j in entities[i]['inbound-entities']) {
				if(!scriptingService.associations)
					scriptingService.associations = []
				var relatedEntity = entities[i]['inbound-entities'][j];
				var relation = entities[i]['outbound-relations']
								.filter(function(rel){
									return relatedEntity.name === rel.targetEntityName;
								})[0];
				var relType;
				if(relation.srcMultiplicity === relation.targetMultiplicity === 2)
					relType = 'many-to-many';
				else
					relType = 'one-to-many';
				var def = {
					'multiplicity': relType,
					'name': relation.name
				};
				//TODO: !!!!
				if(relType==='one-to-many'){
					def['dao'] = relatedEntity.svcName;
					def['key'] = pkName;
					def['joinKey'] = relatedEntity.id;
				}
				if(relType==='many-to-many'){
					def['daoJoin'] = relatedEntity.svcName;
					if(relatedEntity.daoN){
						def['daoN'] = relatedEntity.daoN;
					}
					def['key'] = entities[i].id;
					def['joinKey'] = relatedEntity.joinKey;
				}
				scriptingService.associations.push(def);
			}*/
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
				'fileName': entities[i].svcName + '.html',
				'pageTitle': entities[i].uiTitle,
				'serviceFileName': '../../js/' + template.packageName + '/' + template.scriptingServices[i].fileName,
				'columns': []
			};
			for (var j in entities[i].properties) {
				var nextColumn = entities[i].properties[j];
				web.columns.push({
					'name': nextColumn.name.toLowerCase(),
		            'label': nextColumn.label ? nextColumn.label : nextColumn.name,
		            'widgetType': nextColumn.type==='VARCHAR'? (nextColumn.size<=40?'text':'textarea'): widgetsMapping[nextColumn.type],
		            'key': nextColumn.isPrimaryKey,
		            'visible': true,
		            'order': nextColumn.order
		         });
			}
			//sort asc by property.order
			web.columns.sort(function(next, prev){
				if(prev.order!==undefined && next.order!==undefined){
					return next.order - prev.order;
				}
				return 0;
			});
			template.webContent.push(web);
		}
	}
}]);
})(angular);
