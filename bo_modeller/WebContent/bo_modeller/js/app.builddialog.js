angular.module('businessObjects')
.controller('BuildDialogCtrl', ['masterDataSvc', 'BuildService', '$scope', '$log', '$stateParams', '$window', function(masterDataSvc, BuildService, $scope, $log, $stateParams, $window) {

	this.cfg = {};
	var self = this;
	this.build = function(){
		var buildRequestPayload = angular.copy(self.cfg);
		buildRequestPayload.entities = masterDataSvc.getLoadedData();
		try{
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
