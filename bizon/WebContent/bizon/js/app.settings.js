(function(angular){
"use strict";

angular.module('businessObjects')
.controller('SettingsCtrl', ['$scope', 'masterDataSvc', '$log', function($scope, masterDataSvc, $log) {
	
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
