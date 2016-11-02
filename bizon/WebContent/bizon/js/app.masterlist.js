angular.module('businessObjects')
.controller('MasterListCtrl', ['masterDataSvc', 'modalService', 'Notifications', '$log', '$q', '$state', '$stateParams', '$window', function (masterDataSvc, modalService, Notifications, $log, $q, $state, $stateParams, $window) {

	this.items = masterDataSvc.getLoadedData();
	this.selectedEntity = masterDataSvc.selection[0];
	this.count = masterDataSvc._itemsCount;
	this.showLoadMore;
	this.busy;
	
	this.querySettings = {
		limit: 100,
		sort: 'boh_name',
		order: 'ASC'
	};
	
	this.filterPopover = {
	    templateUrl: 'filter-popover-view.html'
	};
	  
	//TODO: move to directive
	angular.element('.filter-popover').popover({
	    html: true,
	    title: function () {
	        return angular.element('.filter-popover-markup').find('.head').html();
	    },
	    content: function () {
	        return angular.element('.filter-popover-markup').find('.content').html();
	    }
	});
	
	var loadMoreBreakNumber = this.querySettings.limit*2;
	var self = this;
	
/*	function initList(selectedEntity) {
		this.items = masterDataSvc.getLoadedData();
		if(this.items.length > 0) {
			var selectedEntityId;
			if(!selectedEntity){
				selectedEntityId = $stateParams.boId || $state.params.boId || this.items[0].boh_id;
			} else {
				selectedEntityId = selectedEntity.boh_id;
			}
			masterDataSvc.get(selectedEntityId, true)
			.then(function(item){
				//the list might have been expanded to search for an entity by deep link so it needs to be initialized again.
				self.items = masterDataSvc.getLoadedData();
				if(item === undefined){
					fireLocationError.apply(self);
					item = self.items[0];
				}
				return self.selectItem.apply(self, [item]);//select the selection candidate
			})
			.then(function(){
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
				return;
			})
			.catch(function(error){
				handleServiceError('Looking up Buisness Object failed', error.message);
				$state.go($state.current, $stateParams, {reload: true});
			})
			.finally(function(){
				if(!self.showLoadMore)
					self.busy = false;
			});
		} else {
			$state.go('list.empty', {});
		}
	};
	
	function fireLocationError(){
		$log.debug('The requested application path ' + $window.location.href + " is not valid.");
		Notifications.createMessageError($window.location.href + ' is not valid application path. Check the URL and try again.');
	}

	this.selectItem = function(item){
		masterDataSvc.select([item]);
		self.selectedEntity = item;
		$stateParams = angular.extend($stateParams, {
			selectedEntity: item,
			boId: item.boh_id
		});
		$state.go('list.entity', $stateParams, {reload: false});
	};*/
	
	this.createItem = function(){
		masterDataSvc.create()
		.then(function(newItem){
			$stateParams.boId = newItem.boh_id;
			$stateParams.selectedEntity = newItem;
			$log.debug('Business Object with id '+newItem.boh_id+' created successfully');
			Notifications.createMessageSuccess('Business Object created successfully');
			masterDataSvc.selection = [newItem];
			self.items = masterDataSvc.getLoadedData();
//			initList.apply(self, [masterDataSvc.selection[0]]);
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
            headerText: 'Delete "' + entity.boh_name + '"?',
            bodyText: 'Are you sure you want to delete this entity?'
        };

        modalService.showModal({}, modalOptions)
        .then(function (result) {
			self.busy = true;
			masterDataSvc.remove(entity.boh_id, true)
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
	
	function handleServiceError(text, errorPayload){
		var message = masterDataSvc.serviceErrorMessageFormatter(text, errorPayload);
		$log.error('Deleting Buisness Object failed:' + message);
		Notifications.createMessageError('Deleting Buisness Object failed.');
	};
	
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
		              		$state.go('list.entity', {boId: masterDataSvc.getLoadedData()[0].boh_id});
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
	
	var postNext = function(){
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
	
	this.build = function(){
		$state.go('list.entity.build',$stateParams,{reload:true,location:true});
	};


}]);
