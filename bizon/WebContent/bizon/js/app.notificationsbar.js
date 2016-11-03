(function(angular){
"use strict";

angular.module('businessObjects')
.provider('notificationsConfig', function() {
	var config = {};

	function setHideDelay(value){
		config.hideDelay = value;
	}

	function getHideDelay(){
		return config.hideDelay;
	}

	function setAutoHide(value){
		config.autoHide = value;
	}

	function getAutoHide(){
		return config.autoHide;
	}
	
	function setAutoHideAnimation(value){
		config.autoHideAnimation = value;
	}
	
	function getAutoHideAnimation(){
		return config.autoHideAnimation;
	}
	
	function setAutoHideAnimationDelay(value){
		config.autoHideAnimationDelay = value;
	}
	
	function getAutoHideAnimationDelay(){
		return config.autoHideAnimationDelay;
	}

	return {
		setHideDelay: setHideDelay,
		setAutoHide: setAutoHide,
		setAutoHideAnimation: setAutoHideAnimation,
		setAutoHideAnimationDelay: setAutoHideAnimationDelay,
		$get: function(){
			return {
				getHideDelay: getHideDelay,
				getAutoHide: getAutoHide,
				getAutoHideAnimation: getAutoHideAnimation,
				getAutoHideAnimationDelay: getAutoHideAnimationDelay,
			};
		}
	};
})
.service('Notifications', ['$rootScope', function ($rootScope) {
	
	this.showError = function (message) {
		$rootScope.$broadcast('notifications:error', message);
	};

	this.showWarning = function (message) {
		$rootScope.$broadcast('notifications:warning', message);
	};
	
	this.showInfo = function (message) {
		$rootScope.$broadcast('notifications:info', message);
	};

	this.showSuccess = function (message) {
		$rootScope.$broadcast('notifications:success', message);
	};

	this.closeAll = function () {
		$rootScope.$broadcast('notifications:closeAll');
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
.directive('msgShow', ['notificationsConfig', 'Notifications', '$timeout', function(notificationsConfig, Notifications, $timeout) {
        return {
            restrict: 'A',
			template: function(elem, attr){
				var iconClasses = attr.closeicon || 'glyphicon glyphicon-remove';
				return '\ ' +
						'<div class="alert" msg-show="messagesVm.message" msg-text="messagesVm.message.text" ng-if="messagesVm.message">\ '+
						'	<span ng-click="messagesVm.hide()" class="'+iconClasses+' pull-right tools-remove" aria-hidden="true"></span>\ '+
						'</div>\ ';
				/*'\ '+
					'<div class="notifications-container" ng-if="notifications.length">\ ' +
					'	<div class="{{note.type}}" ng-repeat="note in notifications" ng-class="note.animation">\ ' +
					'		<span class="message" >{{note.message}}</span>\ ' +
					'		<span class="' + iconClasses + ' close-click" ng-click="close($index)"></span>\ ' +
					'	</div>\ ' +
					'</div>\ ' +
					'';*/

			},            
            link: function($scope, $element, $attrs) {
                
            	var expr = $attrs.msgShow;                    
                var duration = $attrs.msgShowDuration || 5000;                    
                var slideDuration = $attrs.msgSlideDuration || 'slow';
                
                var notifications = $scope.notifications = [];
				var timers = [];
				var autoHideDelay = notificationsConfig.getHideDelay() || 3000;
				var autoHide = notificationsConfig.getAutoHide() || false;
				var autoHideAnimation = notificationsConfig.getAutoHideAnimation() || '';
				var autoHideAnimationDelay = notificationsConfig.getAutoHideAnimationDelay() || 1200;
                
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
                    }
                );
                
                function show(){
                	var typeClass = 'alert-danger';
                	if(msg.type === Notifications.MSG_TYPE.SUCCESS)
                		typeClass = 'alert-success';
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
							});
					});
        		}
        		
				var removeById = function (id) {
					var found = -1;

					notifications.forEach(function (el, index) {
						if (el.id === id) {
							found = index;
							
							el.animation = {};
							el.animation[autoHideAnimation] = true;
							
							$scope.$apply();
						}
					});

					if (found >= 0) {
						$timeout(function(){
							notifications.splice(found, 1);
						}, autoHideAnimationDelay);
					}
				};	        		
        		
				var notificationHandler = function (event, data, type, animation) {
					var message, hide = autoHide, hideDelay = autoHideDelay;

					if (typeof data === 'object') {
						message = data.message;
						hide = (typeof data.hide === 'undefined') ? autoHide : !!data.hide;
						hideDelay = data.hideDelay || hideDelay;
					} else {
						message = data;
					}

					var id = 'notif_' + (new Date()).getTime();
					notifications.push({id: id, type: type, message: message, animation: animation});
					if (hide) {
						$timeout(function () {
							removeById(id);
							$timeout.cancel(timer);
						}, hideDelay);
					}
				};   			
        		
				$scope.$on('notifications:error', function (event, data) {
					notificationHandler(event, data, 'error');
				});

				$scope.$on('notifications:warning', function (event, data) {
					notificationHandler(event, data, 'warning');
				});
				
				$scope.$on('notifications:info', function (event, data) {
					notificationHandler(event, data, 'info');
				});

				$scope.$on('notifications:success', function (event, data) {
					notificationHandler(event, data, 'success');
				});

				$scope.$on('notifications:closeAll', function () {
					notifications.length = 0;
				})

				$scope.close = function (index) {
					notifications.splice(index, 1);
				};        		
        		
            }
        };
    }
]);
})(angular);