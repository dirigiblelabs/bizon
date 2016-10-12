angular.module('businessObjects', ['ngAnimate', 'ngResource', 'ui.router', 'ui.bootstrap', 'xeditable', 'infinite-scroll', 'angular-loading-bar', 'rzModule'])
.value('THROTTLE_MILLISECONDS', 500)
.config(['$stateProvider', '$urlRouterProvider', 'cfpLoadingBarProvider', function($stateProvider, $urlRouterProvider, cfpLoadingBarProvider) {

		$urlRouterProvider.otherwise("/");
		
		$stateProvider
		.state('list', {
			  url: "/",
		      params: {
		    	  message: undefined,
		    	  selectedEntity: undefined
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
			url: ":boId",
		    params: {
			  	selectedEntity: undefined
		    }, 
			resolve: { 
	            selectedEntity: ['$stateParams',
	                function($stateParams) {
	                	return $stateParams.selectedEntity;
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
			  url: "edit",
		      params: {
		    	  items: undefined,
		    	  selectedEntity: undefined,
		    	  entityForEdit: undefined,
		    	  message: {value: undefined}  
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
			url: "property",
		    params: {
				selectedEntity: undefined,
				item: undefined,
				message: {value: undefined}
		    },
		    onEnter: ['$stateParams', '$state', '$uibModal', function($stateParams, $state, $modal) {
		    	
		    	function goBack(_selectedEntity) {
		        	$state.go("list.entity.edit", {selectedEntity: _selectedEntity}, {location:false});
		        }
		    	
		        var modalInstance = $modal.open({
		        	animation: true,
		            templateUrl: "views/propertyEditor.html",
		            resolve: {
		            	selectedEntity: function() { 
		            		return $stateParams.selectedEntity; 
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
			url: "relation",
		    params: {
				selectedEntity: undefined,
				item: undefined,
				message: {value: undefined}
		    },
		    onEnter: ['$stateParams', '$state', '$uibModal', function($stateParams, $state, $modal) {
		    	
		    	function goBack(_selectedEntity) {
		        	$state.go("list.entity.edit", {selectedEntity: _selectedEntity}, {location:false});
		        }
		    	
		        var modalInstance = $modal.open({
		        	animation: true,
		            templateUrl: "views/relation-editor.html",
		            resolve: {
		            	selectedEntity: function() { 
		            		return $stateParams.selectedEntity; 
		            	}
		            },
		            controller: 'RelationEditorCtrl',
		            controllerAs: 'relEditorVm'
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
		  .state("list.entity.build", {
		  	url: 'build',
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
