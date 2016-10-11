angular.module('businessObjects')
.controller('NotificationsCtrl', ['$stateParams', function ($stateParams) {
	this.message = $stateParams.message;	

	var self = this;	
	this.hide = function(){
		self.nodelay = true;
		self.message = undefined;
	};
			
}]);