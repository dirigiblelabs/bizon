(function(angular){
"use strict";

angular.module('businessObjects')
.controller('SettingsCtrl', ['$scope', 'Settings', '$log', function($scope, Settings, $log) {
	
	this.cfg = Settings;
	this.cfg.templates = Settings.getTemplates().then(function(templatesData){
		this.cfg.templates = templatesData;
	}.bind(this));
	
	this.save = function(){
		$log.info('settings saved');
		$scope.$close();
	};
	
	this.cancel = function(){
		$log.info('settings changes cancelled');	
		$scope.$dismiss();
	};
	
}]);
})(angular);
