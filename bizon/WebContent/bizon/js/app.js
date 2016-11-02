angular.module('businessObjects', ['ngAnimate', 'ngResource', 'ui.router', 'ui.bootstrap', 'xeditable', 'infinite-scroll', 'angular-loading-bar', 'rzModule'])
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
		          }
		      }
		    })
		.state('list.empty', {
		      views: {
			      'detail@': {
					  templateUrl: "views/empty.html",
					  controller: 'EmptyCtrl',
		              controllerAs: 'emptyVm'
			      }
		      }
		   })			    
		.state('list.entity', {
			url: "{boId}",
/*		    params: {
			  	selectedEntity: undefined
		    }, */
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
		        	else
		        		$state.go("list.entity.edit");
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
		        modalInstance.rendered.then(function(){
		        	var $validator = $('.modal-body form').validate({
		        		errorClass: 'has-error',
		        		validClass : 'has-success',
 		        		highlight: function (element, errorClass, validClass) {
				            $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
				            if($validator.numberOfInvalids()>0)
				            	$('.modal-footer .btn.btn-success').addClass('disabled');
				        },
				        unhighlight: function(element, errorClass, validClass) {
				        	$(element).closest('.form-group').removeClass('has-error').addClass('has-success');
				        	if($validator.numberOfInvalids()<1)
					        	$('.modal-footer .btn.btn-success').removeClass('disabled');	
				        },
		 		        success: "has-success"
		        	});
		        	$('.form-control[required]').each(function(i){
		        		$validator.element(this);
		        	});
		        });
		        modalInstance.result.then(goBack, goBack);
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
		        	else
		        		$state.go("list.entity.edit");
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
		        modalInstance.rendered.then(function(){
		        	//moved to controller
		        });
		        modalInstance.result.then(goBack, goBack);
		    }]
		  })		  
		  .state("list.entity.build", {
		    params: {
				message: {value: undefined}
		    },
		    onEnter: ['$stateParams', '$state', '$uibModal', function($stateParams, $state, $modal) {
		    			    	
		        var modalInstance = $modal.open({
		        	animation: true,
		            templateUrl: "views/buildDialog.html",
		            controller: 'BuildDialogCtrl',
		            controllerAs: 'builderVm'
		        });
		    	
		        modalInstance.rendered.then(function(){
		        	var $validator = $('.modal-body form').validate({
		        		errorClass: 'has-error',
		        		validClass : 'has-success',
 		        		highlight: function (element, errorClass, validClass) {
				            $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
				            if($validator.numberOfInvalids()>0)
				            	$('.modal-footer .btn.btn-success').addClass('disabled');
				        },
				        unhighlight: function(element, errorClass, validClass) {
				        	$(element).closest('.form-group').removeClass('has-error').addClass('has-success');
				        	if($validator.numberOfInvalids()<1)
					        	$('.modal-footer .btn.btn-success').removeClass('disabled');	
				        },
		 		        success: "has-success"
		        	});
		        	$('.form-control[required]').each(function(i){
		        		$validator.element(this);
		        	});
		        });
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
                }
            };
        }
    ])
	.run(['editableOptions', function(editableOptions)  {
	  editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
	}]);
