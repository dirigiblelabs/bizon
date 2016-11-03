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
		var buildRequestPayload = angular.copy(self.cfg);
		buildRequestPayload.entities = masterDataSvc.getLoadedData();
		try{
			if(self.slider.value === 1){
				buildRequestPayload.ds = true;
			} else if(self.slider.value === 2){
				buildRequestPayload.ds = true;
				buildRequestPayload.svc = true;
			}  else if(self.slider.value === 3){
				buildRequestPayload.ds = true;
				buildRequestPayload.svc = true;
				buildRequestPayload.web = true;
			}
			BuildService.build(buildRequestPayload);
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
}]);
})(angular);