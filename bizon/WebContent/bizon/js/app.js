(function(angular){
"use strict";

angular.module('businessObjects', ['ngAnimate', 'ngResource', 'ui.router', 'ui.bootstrap', 'xeditable', 'infinite-scroll', 'angular-loading-bar', 'rzModule', 'angularFileUpload'])
.value('THROTTLE_MILLISECONDS', 500)
.config(['$stateProvider', '$urlRouterProvider', 'cfpLoadingBarProvider', function($stateProvider, $urlRouterProvider, cfpLoadingBarProvider) {

		$urlRouterProvider.otherwise("/");
		
		$stateProvider
		.state('list', {
			  url: "/",
		      params: {
		    	  message: undefined
		      },
		      views: {
		          'master': {
		              templateUrl: 'views/master-list.html',
		              controller: 'MasterListCtrl',
		              controllerAs: 'masterVm'
		          },
		          'detail': {
		              templateUrl: 'views/none.html'
		          },
		          'notifications': {
		              templateUrl: 'views/notifications.html',
		              controller: 'NotificationsCtrl',
		              controllerAs: 'messagesVm'
		          },
		          'toolbar': {
		          	  templateUrl: 'views/toolbar.html',
		              controller: 'ToolbarCtrl',
		              controllerAs: 'toolbarVm'
		          }
		      }
		    })
		.state('list.notification', {
	    	params: {
	    		message: undefined
	    	},
	    	views: {
	          'notifications@': {
	              templateUrl: 'views/notifications.html',
	              controller: 'NotificationsCtrl',
	              controllerAs: 'messagesVm'
	          }
	    	}
	    })		    
		.state('list.empty', {
		    views: {
		      'detail@': {
				  templateUrl: "views/empty.html",
				  controller: 'EmptyCtrl',
	              controllerAs: 'emptyVm'
		      },
		      'templateLib@list.empty': {
				templateUrl: 'views/templates.html',
				controller: 'TemplatesCtrl',
				controllerAs: 'tmplVm'
		      }
	    	}
	    })		   
		.state('list.empty.tmplfamiliy', {
			params: {
				tmplFamily:undefined
			},
		    views: {
			    'templateLib@list.empty': {
					templateUrl: 'views/templateFamily.html',
					controller: 'TemplatesCtrl',
					controllerAs: 'tmplVm'
			    }
		    }
		})		   		   
		.state('list.entity', {
			url: "{boId}",
			resolve: { 
	            selectedEntity: ['$stateParams', 'masterDataSvc',
	                function($stateParams, masterDataSvc) {
	                	if($stateParams.boId){
	                		return masterDataSvc.get($stateParams.boId, true);
	                	} else {
	                		return $stateParams.selectedEntity;	                	
	                	}
                }]
            },
            views: {
		    	  'detail@': {
					  templateUrl: "views/detail_view.html",
					  controller: 'DetailsCtrl',
		              controllerAs: 'detailsVm'
			      }
		     }
		   })	
		.state('list.entity.edit', {
			url: "/edit",
			params: {
				entityForEdit: undefined
			},
			views: {
				'master@': {
				    templateUrl: 'views/none.html'
				},
				'detail@': {
					templateUrl: "views/detail_editor.html",
					controller: 'EditCtrl',
				    controllerAs: 'detailsEditorVm'
				}
			}
	    })
		.state("list.entity.edit.items", {
			resolve: {
				entityForEdit: ['$stateParams', function($stateParams){
					return $stateParams.entityForEdit;
				}],
				item: ['$stateParams', function($stateParams){
					return $stateParams.item;
				}]
			},
		    params: {
				item: undefined
		    },
		    onEnter: ['$state', '$uibModal', 'entityForEdit', 'item', function($state, $modal, entityForEdit, item) {
		    	
		    	function goBack(_selectedEntity) {
		    		if(_selectedEntity)
		        		$state.go("list.entity.edit", {entityForEdit: _selectedEntity}, {reload:true});
		        }
		    	
		        var modalInstance = $modal.open({
		        	animation: true,
		            templateUrl: "views/propertyEditor.html",
		            resolve: {
		            	selectedEntity: function() { 
		            		return entityForEdit; 
		            	},
		            	item: function(){
		            		return item;
		            	}
		            },
		            controller: 'PropertyEditorCtrl',
		            controllerAs: 'propsEditorVm'
		        });
		        modalInstance.result
		        	.then(goBack)
		        	.catch(function(reason){
		        		$state.go("list.entity.edit");
		        	});
		    }]
		  })
		.state("list.entity.edit.relations", {
		    params: {
				entityForEdit: undefined,				
				relation: undefined
		    },
			resolve: {
				entityForEdit: ['$stateParams', function($stateParams){
					return $stateParams.entityForEdit;
				}],
				relation: ['$stateParams', function($stateParams){
					return $stateParams.relation;
				}]
			},		    
		    onEnter: ['$state', '$uibModal', 'entityForEdit', 'relation', function($state, $modal, entityForEdit, relation) {
		    	
		    	function goBack(_selectedEntity) {
		    		if(_selectedEntity)
		        		$state.go("list.entity.edit", {entityForEdit: _selectedEntity}, {reload:true});
		        }
		    	
		        var modalInstance = $modal.open({
		        	animation: true,
		            templateUrl: "views/relation-editor.html",
		            resolve: {
		            	selectedEntity: function() { 
		            		return entityForEdit; 
		            	},
		            	relation: function(){
		            		return relation;
		            	}
		            },
		            controller: 'RelationEditorCtrl',
		            controllerAs: 'relEditorVm'
		        });
		        modalInstance.result
		        	.then(goBack)
					.catch(function(reason){
		        		$state.go("list.entity.edit");
		        	});		        	
		    }]
		  })		  
		  .state("list.entity.build", {
		  	onEnter: ['$state', 'Notifications', '$uibModal', function($state, Notifications, $modal) {	
		        var modalInstance = $modal.open({
		        	animation: true,
		            templateUrl: "views/buildDialog.html",
		            controller: 'BuildDialogCtrl',
		            controllerAs: 'builderVm'
		        });
		        modalInstance.result
		        	.then(function() {
		    			Notifications.createMessageSuccess('App build finished successfully');
		        	})
		        	.finally(function(){
		        		$state.go('list.notification', {}, {reload:true});
		        	});
		    }]
		  })
		  .state("list.entity.export", {
		  	onEnter: ['$state', 'masterDataSvc', function($state, masterDataSvc) {
		  		masterDataSvc.exportData().then(function(data){
					var blob = new Blob([ JSON.stringify(data, null, 2) ], { type : 'text/json' });
		  			var objectURL = window.URL.createObjectURL(blob);
		  			var a = document.createElement('a');
				      a.href = objectURL;
				      a.download = 'bizon.json';
				      a.target = '_blank';
				      a.click();
		  			$state.go('list.entity');
		  		});
		    }]
		  })
		  .state("list.import", {
		  	onEnter: ['$state', '$stateParams', '$uibModal', function($state, $stateParams, $modal) {
		    	function goBack() {
	        		$state.go("list", {}, {reload:true});
		        }
		        var modalInstance = $modal.open({
		        	animation: true,
		            templateUrl: "views/import.html",
		            controller: 'ImportCtrl',
		            controllerAs: 'importVm'
		        });
				modalInstance.result.then(goBack, goBack);
		      	//$state.go('list.entity');
		    }]
		  }) 
		  .state("list.settings", {
			  resolve: {
                "$previousState": ["$state", "$stateParams", function ($state, $stateParams) {
                    return {
                    	"state": $state.current,
                    	"params": $state.params
                    };
                }]
              },
			  onEnter: ['$state', '$previousState', '$uibModal', function($state, $previousState, $modal) {
		        var modalInstance = $modal.open({
		        	animation: true,
		            templateUrl: "views/settings.html",
		            controller: 'SettingsCtrl',
		            controllerAs: 'settingsVm'
		        });
				modalInstance.result
				.finally(function(){
					if($previousState.state.name === 'list.entity')
						$state.go('list.entity', $previousState.params);
					else if($previousState.state.name === 'list.entity.edit')
						$state.go('list.entity.edit', $previousState.params);
					else if($previousState.state.name === 'list.empty')
						$state.go('list.empty', $previousState.params);
					//$state.go($previousState.state, $previousState.params);
				}.bind(this));
			  }]
		  });
		  
		cfpLoadingBarProvider.includeSpinner = false;
		  
	}])
	.directive('bootstrapSwitch', [
        function() {
        	/*http://benjii.me/2014/07/angular-directive-for-bootstrap-switch/*/
            return {
                restrict: 'A',
                require: '?ngModel',
                link: function(scope, element, attrs, ngModel) {
                    element.bootstrapSwitch();
                    element.on('switchChange.bootstrapSwitch', function(event, state) {
                        if (ngModel) {
                            scope.$apply(function() {
                                ngModel.$setViewValue(state);
                            });
                        }
                    });

                    scope.$watch(attrs.ngModel, function(newValue, oldValue) {
                        if (newValue) {
                            element.bootstrapSwitch('state', true, true);
                        } else {
                            element.bootstrapSwitch('state', false, true);
                        }
                    });
                    
                    scope.$watch(attrs.ngDisabled, function(newValue, oldValue) {
                        if (newValue) {
                            element.bootstrapSwitch('disabled', true);
                        } else {
                            element.bootstrapSwitch('disabled', false);
                        }
                    });
                }
            };
        }
    ])
    .directive('formFocus', ['$timeout', 
     	function($timeout) {
	     	 return {
	                restrict: 'A',
	                link: function(scope, element, attrs) {
	                	$timeout(function(){
							element.focus().select();
			        	});
	                }
		 	}
 		}
     ])
	.directive('formValidation', ['$timeout',
        function($timeout) {
        
        	angular.element.validator.addMethod( "alphanumeric", function( value, element, regex) {
				return this.optional( element ) || new RegExp(regex, 'gi').test(value);
			}, "Valid input consits of letters, numbers, and underscores only");
			
			var getAttrValue = function(element, attr){
				return angular.fromJson(angular.element.attr(element,attr));
			}.bind(this);
			
			angular.element.validator.addMethod( "noneof", function( value, element, values) {
				var vals = getAttrValue(element, 'data-rule-noneof');
				return this.optional( element ) || !vals.length || !vals.includes(value);
			}, "Already exists. Choose another value.");
			
            return {
                restrict: 'A',
                link: function(scope, formElement, attrs) {
                	var $validator;
                	var formValidationOptions = {
						errorClass: 'has-error',
				     	validClass : 'has-success',
				     	ignore: 'input[style*="position: absolute"],.form-validation-ignore,.form-control[novalidate]',
				 		highlight: function (element, errorClass, validClass) {
				            angular.element(element).closest('.form-group').removeClass('has-success').addClass('has-error');
				            if($validator.numberOfInvalids()>0)
				            	angular.element('.modal-footer .btn.btn-success').addClass('disabled');
				        },
						unhighlight: function(element, errorClass, validClass) {
					        	angular.element(element).closest('.form-group').removeClass('has-error').addClass('has-success');
					        	if($validator.numberOfInvalids()<1)
						        	angular.element('.modal-footer .btn.btn-success').removeClass('disabled');
					        },
						success: "has-success"
					};			
					$timeout(function(){
						$validator = angular.element(formElement).validate(formValidationOptions);
						//validator.form();//This doesn't work as expected so we need to iterate and validate each element separately
						angular.element('.form-control:not([no-validate])', angular.element(formElement))
						.each(function(){
			        		$validator.element(this);
			        	});
		        	});

                }
            };
        }
    ])
	.run(['editableOptions', function(editableOptions)  {
	  editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
	}]);
})(angular);
