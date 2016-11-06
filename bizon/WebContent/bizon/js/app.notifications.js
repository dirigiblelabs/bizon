(function(angular){
"use strict";

angular.module('businessObjects')
.provider('notificationsConfig', function() {
	var config = {};

	function setDuration(value){
		config.duration = value;
	}

	function getDuration(){
		return config.duration;
	}
	
	function setSlideDuration(value){
		config.slideDuration = value;
	}
	
	function getSlideDuration(){
		return config.slideDuration;
	}

	return {
		setDuration: setDuration,
		setSlideDuration: setSlideDuration,
		$get: function(){
			return {
				getDuration: getDuration,
				getSlideDuration: getSlideDuration
			};
		}
	};
})
.service('Notifications', [function(){
	
	return {		
	
		MSG_TYPE: Object.freeze({SUCCESS: 0, ERROR: 1}),
		
		getMessage: function(){
			return this.message;
		},
		
		createMessage: function(_text, _type){
			this.message = {
				text: _text,
				type: _type
			};			
			return this.message;
		},
		
		createMessageSuccess: function(text){
			return this.createMessage(text, this.MSG_TYPE.SUCCESS);
		},
		
		createMessageError: function(text){
			return this.createMessage(text, this.MSG_TYPE.ERROR);
		}
		
	};
}])
.controller('NotificationsCtrl', ['Notifications', function (Notifications) {
	
	this.message = Notifications.getMessage();
	var self = this;
	
	this.hide = function(){
		self.nodelay = true;
		self.message = Notifications.message = undefined;
	};
			
}])
.directive('msgShow', ['notificationsConfig', '$timeout', 'Notifications', function(notificationsConfig, $timeout, Notifications) {
        return {
            restrict: 'A',
            link: function($scope, $element, $attrs) {
            
            	var MSG_TYPE_CLASS = Object.freeze({SUCCESS: 'alert-success', ERROR: 'alert-danger'});
                
            	var expr = $attrs.msgShow;                    
                var duration = $attrs.msgShowDuration || notificationsConfig.getDuration() || 5000;
                var slideDuration = $attrs.msgSlideDuration || notificationsConfig.getSlideDuration() || 'slow';
                
                var self = this;
				var timer;
				
                var msg = $scope.$eval(expr);
                
                if ( ! msg ) {
                    $element.hide();
                } else {
                	show.apply(self, [msg]);
            	}

                $scope.$watch(expr, function( newValue, oldValue ) {
                    // Ignore first-run values since we've already defaulted the element state.
                    if ( newValue === oldValue ) {
                        return;
                    }
                    
                    // Show element.
                    if ( newValue ) {
						show.apply(self, [newValue]);
                    // Hide element.
                    } else {
                    	hide.apply(self);
                    }
                });
                
                function show(){
                	var typeClass = MSG_TYPE_CLASS.ERROR;
                	if(msg.type === Notifications.MSG_TYPE.SUCCESS)
                		typeClass = MSG_TYPE_CLASS.SUCCESS;
					$element.addClass(typeClass);
                    var text = $scope.$eval($attrs.msgText) || '';
                	$element.append('<span class="msg-text">'+text+'</span>');
					$element.show();
					hide.apply(self, [$scope]);
            	}
            	
            	function hide(){
            		if($scope.messagesVm.nodelay){
            			hideElement.apply(self, [timer]);
            			$scope.messagesVm.nodelay = false;
        			}else{
                    	timer = $timeout(duration)
                    	.then(function(){
                        	hideElement.apply(self,[timer]);
						});            			
    				}
            	}
            	
            	function hideElement(timer){
					$element.fadeTo(slideDuration, 0, function(){
	                	$element.find('.msg-text').remove();
						$element.parent().slideUp(slideDuration, function(){
							if(timer)
								$timeout.cancel(timer);
							$scope.messagesVm.hide.apply($scope.messagesVm);
						});
					});
        		}

            }
        };
    }
]);
})(angular);
