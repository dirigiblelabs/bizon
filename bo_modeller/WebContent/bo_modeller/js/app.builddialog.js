angular.module('businessObjects')
.controller('BuildDialogCtrl', ['masterDataSvc', 'BuildService', '$scope', function(masterDataSvc, BuildService, $scope) {

	this.cfg = {};
	var self = this;
	this.build = function(){
		var buildRequestPayload = angular.copy(self.cfg);
		buildRequestPayload.entities = masterDataSvc.getLoadedData();
		BuildService.build(buildRequestPayload);
		$scope.$close();
	};
	this.cancel = function(){
		$scope.$dismiss();
	};
}])
