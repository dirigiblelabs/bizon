angular.module('businessObjects')
.controller('MasterListCtrl', ['masterDataSvc', 'modalService', '$log', '$q', '$state', '$stateParams', '$window', function (masterDataSvc, modalService, $log, $q, $state, $stateParams, $window) {

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
	
	var loadMoreBreakNumber = this.querySettings.limit*2;
	var self = this;
	
	function initList(selectedEntity) {
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
		$stateParams.message = {
			text: $window.location.href + ' is not valid application path. Check the URL and try again.',
			type: 'alert-danger'
		};
	}

	this.selectItem = function(item){
		masterDataSvc.select([item]);
		self.selectedEntity = item;
		$stateParams = angular.extend($stateParams, {
			selectedEntity: item,
			boId: item.boh_id
		});
		$state.go('list.entity', $stateParams, {reload: false});
	};
	
	this.createItem = function(){
		masterDataSvc.create()
		.then(function(newItem){
			$stateParams.boId = newItem.boh_id;
			$stateParams.selectedEntity = newItem;
			$stateParams.message = {
				text: 'New Buisness Object successfully created.',
				type: 'alert-success'
			};
			masterDataSvc.selection = [newItem];
			initList.apply(self, [masterDataSvc.selection[0]]);
			return;
		})
		.catch(function(reason){
			handleServiceError('Creating new Buisness Object failed', reason);
		})
		.finally(function(){
			$state.go("list.entity", $stateParams, {reload: false});
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
			masterDataSvc.remove(entity.boh_id)
			.then(function(){
				delete $stateParams.boId;
				delete $state.params.boId;
				delete $stateParams.selectedEntity;
				delete $state.params.selectedEntity;					
				$stateParams.message = {
						text: 'Buisness Object successfully deleted.',
						type: 'alert-success'
					};

			})
			.catch(function(reason){
				handleServiceError('Deleting Buisness Object failed', reason);
			})
			.finally(function(){
				$state.go($state.current, $stateParams, {reload: true, inheirt: false});
				initList.apply(self);
			});	        
        });
        
	};
	
	function handleServiceError(text, errorPayload){
		var message = masterDataSvc.serviceErrorMessageFormatter(text, errorPayload);
		$log.error(message);			
		$stateParams.message = {
				text: message,
				type: 'alert-danger'
		};
	};
	
	this.next = function(){
		if(!self.busy || (self.busy && self.showLoadMore)){
			masterDataSvc.querySettings = this.querySettings;
			$q.when(masterDataSvc.next())
			.catch(function(err){
				console.error(err);
				//..
			})
			.finally(function(){
				initList.apply(self, [masterDataSvc.selection[0]]);
			});			
		}
		self.busy = true;
	};
	
	this.build = function(){
		$state.go('list.entity.build',$stateParams,{reload:true,location:true});
	};


}]);
