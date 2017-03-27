(function(angular){
"use strict";

angular.module('businessObjects')
.controller('MasterListCtrl', ['masterDataSvc', 'modalService', 'Notifications', 'Settings', '$log', '$q', '$state', '$stateParams', '$window', function (masterDataSvc, modalService, Notifications, Settings, $log, $q, $state, $stateParams, $window) {

	this.app = Settings;
	this.items = masterDataSvc.getLoadedData();
	this.selectedEntity = masterDataSvc.selection[0];
	this.count = masterDataSvc._itemsCount;
	this.showLoadMore;
	this.busy;
	
	this.querySettings = {
		$limit: 100,
		$sort: 'label',
		$order: 'asc'
	};
	
	this.filterPopover = {
	    templateUrl: 'filter-popover-view'
	};

	var loadMoreBreakNumber = this.querySettings.limit*2;
	var self = this;
	
	this.createItem = function(){
		masterDataSvc.create()
		.then(function(newItem){
			$stateParams.boId = newItem.id;
			$stateParams.selectedEntity = newItem;
			$log.debug('Business Object with id '+newItem.id+' created successfully');
			Notifications.createMessageSuccess('Business Object created successfully');
			masterDataSvc.selection = [newItem];
			self.items = masterDataSvc.getLoadedData();
			return;
		})
		.catch(function(reason){
			handleServiceError('Creating new Buisness Object failed', reason);
		})
		.finally(function(){
			$state.go("list.entity", {boId:$stateParams.boId}, {reload: false});
		});
	};
	
	this.deleteItem = function(entity){
		
		var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Delete entity',
            headerText: 'Delete "' + entity.label + '"?',
            bodyText: 'Are you sure you want to delete this entity?'
        };

        modalService.showModal({}, modalOptions)
        .then(function () {
			self.busy = true;
			masterDataSvc.remove(entity.id, true)
			.then(function(){
				delete $stateParams.boId;
				delete $state.params.boId;
				delete $stateParams.selectedEntity;
				delete $state.params.selectedEntity;			
				$log.debug('Business object deleted');
				Notifications.createMessageSuccess('Buisness Object successfully deleted.');

			})
			.catch(function(reason){
				handleServiceError('Deleting Buisness Object failed', reason);
			})
			.finally(function(){
				$state.go('list', {message: $stateParams.message}, {reload: true, inheirt: false});
				//initList.apply(self);
			});	        
        });
        
	};
	
	this.deleteAll = function(){
		
		var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Delete entity',
            headerText: 'Delete everything?',
            bodyText: 'Are you sure you want to completely delete all objects?'
        };

        modalService.showModal({}, modalOptions)
        .then(function () {
			self.busy = true;
			masterDataSvc.remove(undefined, true)
			.then(function(){
				delete $stateParams.boId;
				delete $state.params.boId;
				delete $stateParams.selectedEntity;
				delete $state.params.selectedEntity;			
				$log.debug('All business objects deleted');
				Notifications.createMessageSuccess('All Business Object successfully deleted.');

			})
			.catch(function(reason){
				handleServiceError('Deleting All Buisness Objects failed', reason);
			})
			.finally(function(){
				$state.go('list', {message: $stateParams.message}, {reload: true, inheirt: false});
			});	        
        });
        
	};	
	
	function handleServiceError(text, errorPayload){
		var message = masterDataSvc.serviceErrorMessageFormatter(text, errorPayload);
		$log.error('Deleting Buisness Object failed:' + message);
		Notifications.createMessageError('Deleting Buisness Object failed.');
	}

	function postNext(){
		if(self.items.length === loadMoreBreakNumber){
			return masterDataSvc.hasMore()
			.then(function(_hasMore){
				self.showLoadMore = _hasMore;
				loadMoreBreakNumber = loadMoreBreakNumber + self.querySettings*2;
			});
		} else {
			self.showLoadMore = false;
		}
		self.count = masterDataSvc._itemsCount;
	}
	
	this.next = function(){
		if(!self.busy || (self.busy && self.showLoadMore)){
			masterDataSvc.querySettings = this.querySettings;
			$q.when(masterDataSvc.next())
			.catch(function(err){
				$log.error(err);
				//..
			})
			.finally(function(){
				self.items = masterDataSvc.getLoadedData();
				if(self.items.length > 0) {
					if($state.current.name==='list.entity' && $state.params.boId!==undefined){
						masterDataSvc.get($stateParams.entityId)
						.then(function(entity){
							if(entity){
	              				postNext.apply(self);
							}
						});				
					} else {
						postNext.apply(self);
						if(masterDataSvc.getLoadedData().length>0){
		              		$state.go('list.entity', {boId: masterDataSvc.getLoadedData()[0].id});
		              	}
		              	self.busy = false;
					}
					//initList.apply(self, [masterDataSvc.selection[0]]);		
				} else {
					$state.go('list.empty');
				}
			});			
		}
		self.busy = true;
	};
	
	this.build = function(){
		$state.go('list.entity.build',$stateParams,{reload:true,location:true});
	};

}])
.directive('filterPopover', ['$timeout',
        function($timeout) {
            return {
                restrict: 'A',
                link: function(scope, element, attrs) {

					var templateDOMElementSelector = attrs['filterPopoverTemplateSelector'] || '#'+scope.masterVm.filterPopover.templateUrl;
					
					$timeout(function(){
						var templateElement = angular.element(element[0].ownerDocument.querySelector(templateDOMElementSelector));
						if(templateElement){
							element.popover({
							    html: true,
							    title: function () {
							        return angular.element(templateElement[0].querySelector('.head')).html();
							    },
							    content: function () {
									return angular.element(templateElement[0].querySelector('.content')).html();
							    }
							});
						}
					});
                }
            };
        }
    ]);
})(angular);
