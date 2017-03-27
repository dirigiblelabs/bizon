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
	.service('Relations', ['masterDataSvc', 'Entity', '$q', function(MasterDataService, Entity, $q){
		var relatedEntitySubset = function(entity){
			return {
				"id": entity["id"],
				"name": entity["name"],
				"label": entity["label"],
				"table": entity["table"],
				"properties": entity["properties"]
			};
		};				
		var getSourceEntityKeyProperty = function(relation){
			return relation.source.properties
					.find(function(prop){
						return relation.srcKey === prop.name;
					}.bind(this));
		};
		var getRelationTargetEntity = function(relation){
			var targetEntity;
			if(relation.targetEntityName){
				if(relation.target && relation.target.name === relation.targetEntityName){
					targetEntity = relation.target;
				} else {
					//first try loaded entities
					targetEntity = MasterDataService.getByName(relation.targetEntityName, false)
									.then(function(loadedTargetEntity){
										if(!loadedTargetEntity){
											//if the required entity is still not loaded, look it up remotely without affecting the local entity cache
											var params = {"name":relation.targetEntityName, "$filter":"name", "$expand": "properties"};
											return Entity.queryByProperty(params).$promise
													.then(function(_loadedTargetEntities){
														var _loadedTargetEntity = _loadedTargetEntities[0];
														if(!_loadedTargetEntity)
															return;
														return relatedEntitySubset(_loadedTargetEntity);
													}.bind(this));
										}
										return relatedEntitySubset(loadedTargetEntity);
									}.bind(this));
				}
			}
			return $q.when(targetEntity);
		};
		
		var setRelationTargetEntity = function(relation, targetEntity){
			if(targetEntity)
				relation.target = relatedEntitySubset(targetEntity);
			else
				getRelationTargetEntity(relation)
				.then(function(targetEntity){
					if(targetEntity){
						relation.target = targetEntity;
						relation.targetEntityKeyProperty = getTargetEntityKeyProperty(relation);
					} else {
						//delete target dependent properties if any
						delete relation.target;
						delete relation.targetEntityFkName;
						delete relation.targetMultiplicity;
						delete relation.joinTableTargetKey;
					}
					return targetEntity;
				}.bind(this));
		};
		var getRelationSourceEntity = function(relation){
			var sourceEntity;
			if(relation.srcEntityName){
				if(relation.source && relation.source.name === relation.srcEntityName){
					sourceEntity = relation.source;
				} else {
					//first try loaded entities
					sourceEntity = MasterDataService.getByName(relation.srcEntityName, false)
									.then(function(loadedSourceEntity){
										if(!loadedSourceEntity){
											return;
										} else {
											return relatedEntitySubset(loadedSourceEntity);
										}
									}.bind(this))
									.then(function(loadedSourceEntity){
										if(loadedSourceEntity)
											return loadedSourceEntity;
											
										//if the required entity is still not loaded, look it up remotely without affecting the local entity cache
										var params = {"name":relation.srcEntityName, "$filter":"name", "$expand": "properties"};
										return Entity.queryByProperty(params).$promise
												.then(function(_loadedSourceEntities){
													var _loadedSourceEntity = _loadedSourceEntities[0];
													if(!_loadedSourceEntity)
														return;
													return relatedEntitySubset(_loadedSourceEntity);
												}.bind(this));
									}.bind(this))
									.then(function(loadedSourceEntity){
										relation.source = loadedSourceEntity;
										relation.srcKeyProperty = getSourceEntityKeyProperty(relation);
									}.bind(this));
				}
			}
			return sourceEntity;
		};
		var setRelationSourceEntity = function(relation, sourceEntity){
			relation.source = sourceEntity?relatedEntitySubset(sourceEntity):undefined || getRelationSourceEntity(relation);
//			relation.srcKeyProperty = getSourceEntityKeyProperty(relation);
		};
		var getTargetEntityKeyProperty = function(relation){
			return relation.target.properties.find(function(prop){
						return relation.targetEntityFkName === prop.name;
					}.bind(this));
		};
		var getJoinEntity = function(relation){
			var entityPromise;
			if(relation.joinEntity){
				entityPromise = $q.when(relation.joinEntity).$promise;
			} else {
				entityPromise = MasterDataService.getByName(relation.joinTableName)
					.then(function(entity){
						return entity;
					}.bind(this));
			}
			return entityPromise;
		};
		var getJoinEntitySourceKeyProperty = function(relation){
			return getJoinEntity(relation)
					.then(function(joinEntity){
						return joinEntity.properties
								.find(function(prop){
									return prop.name === relation.joinTableSrcKey;
								}.bind(this));
					}.bind(this));
		};
		var getJoinEntityTargetKeyProperty = function(relation){
			return getJoinEntity(relation)
					.then(function(joinEntity){
						return joinEntity.properties
								.find(function(prop){
									return prop.name === relation.joinTableTargetKey;
								}.bind(this));
					}.bind(this));
		};
		
		var decorateRelation = function(relation, sourceEntity, targetEntity){
			setRelationSourceEntity(relation, sourceEntity);
			setRelationTargetEntity(relation, targetEntity);
			return relation;
		};
		
		return {
			relatedEntitySubset: relatedEntitySubset,
			decorateRelation: decorateRelation,
			getRelationTargetEntity: getRelationTargetEntity,
			setRelationTargetEntity: setRelationTargetEntity,
			getRelationSourceEntity: getRelationSourceEntity,
			setRelationSourceEntity: setRelationSourceEntity,
			getSourceEntityKeyProperty: getSourceEntityKeyProperty,
			getTargetEntityKeyProperty: getTargetEntityKeyProperty,
			getJoinEntity: getJoinEntity,
			getJoinEntitySourceKeyProperty: getJoinEntitySourceKeyProperty,
			getJoinEntityTargetKeyProperty: getJoinEntityTargetKeyProperty
		};
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
