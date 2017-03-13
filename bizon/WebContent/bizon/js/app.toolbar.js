(function(angular){
"use strict";

angular.module('businessObjects')
.controller('ToolbarCtrl', ['masterDataSvc', '$state', '$stateParams', '$log', function(masterDataSvc, $state, $stateParams, $log) {
	this.data = masterDataSvc['$count'];
	
	this.newModel = function(){
		masterDataSvc.create()
		.then(function(newItem){
			$stateParams.boId = newItem.id;
			$stateParams.message = {
				text: 'New Buisness Object successfully created.',
				type: 'alert-success'
			};
		}, function(reason){
			var message = masterDataSvc.serviceErrorMessageFormatter('Creating new Buisness Object failed', reason);
			$log.error(message);			
			$stateParams.message = {
					text: message,
					type: 'alert-danger'
			};
		})
		.finally(function(){
			$state.go($state.current, $stateParams, {reload: true});
		});
	};
	
}]);

})(angular);
