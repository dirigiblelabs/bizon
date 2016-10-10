angular.module('businessObjects')
.controller('BuildDialogCtrl', ['masterDataSvc', 'BuildService', '$scope', '$log', '$stateParams', '$window', function(masterDataSvc, BuildService, $scope, $log, $stateParams, $window) {

	this.cfg = {};
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
	
	this.build = function(){
		var buildRequestPayload = angular.copy(self.cfg);
		buildRequestPayload.entities = masterDataSvc.getLoadedData();
		try{
			if(self.slider.value === 1){
				buildRequestPayload.ds = true;
			} else if(self.slider.value === 2){
				buildRequestPayload.ds = true;
				buildRequestPayload.svc = true;
			}  else if(self.slider.value === 2){
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
