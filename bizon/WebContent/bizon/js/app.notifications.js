angular.module('businessObjects')
.controller('NotificationsCtrl', ['$timeout', '$stateParams', function ($timeout, $stateParams) {
	
	var messageEl = $('.alert');
	this.message = $stateParams.message;
	
	this.hide = hideMessage;
	
	var timer;
	
	if(this.message){
		
		this.messageTypeClass = this.message.type || 'alert-danger';
		var self = this;			
		timer = $timeout(5000)
			.then(function(){
				hideMessage.apply(self);
			});	
	}
	
	function hideMessage(element){
		if(this.message){
			element = element || messageEl;
			$(element).fadeTo('slow', 0, function(){
				$(element).parent().slideUp('slow', function(){
					this.message = undefined;
					$timeout.cancel(timer);
				});
			});	
		}
	}

	this.destroy = function(){
		if(timer){
			$timeout.cancel(timer);
		}
	};
			
}])