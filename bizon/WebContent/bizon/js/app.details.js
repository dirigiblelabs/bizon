angular.module('businessObjects')
.controller('DetailsCtrl', ['masterDataSvc', 'modalService', 'Notifications', 'selectedEntity', '$log', '$state', '$stateParams' , function (masterDataSvc, modalService, Notifications, selectedEntity, $log, $state, $stateParams) {
	
	this.selectedEntity = selectedEntity;
	var self = this;
	
//FIXME!!!	
	this.showProperties = function(){
		if(this._selectedItemDetails){
			this.selectedItemDetails = this._selectedItemDetails.filter(function(v, i, arr){
				if(!v.boi_type || v.boi_type!=='Relationship'){
					return true;
				}
				return false;
			}, this);
		}
	};
	
	function showDetails(item){
		if(item){
			this._selectedItemDetails = item.properties;
			this.showProperties.apply(this);//Initial content to show	
		}
	}
	
	showDetails.apply(this, [this.selectedEntity]);
	
	this.showRelationships = function(){
		if(this._selectedItemDetails){
			this.selectedItemDetails = this._selectedItemDetails.filter(function(v, i, arr){
				if(v.boi_type && v.boi_type==='Relationship'){
					return true;
				}
				return false;
			}, this);
		}
	};
	
	function handleServiceError(text, errorPayload){
		var message = masterDataSvc.serviceErrorMessageFormatter(text, errorPayload);
		$log.error(message);
		Notifications.createMessageError(message);						
	};
	
	this.startEdit = function() {
	    $stateParams.entityForEdit = angular.copy(this.selectedEntity);		    
	    $state.go("list.entity.edit", $stateParams, {location:false});
	};
	
	this.duplicateItem = function() {
		var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Duplicate entity',
            headerText: 'Duplicate "' + self.selectedEntity.boh_name + '"?',
            bodyText: 'Are you sure you want to duplicate this entity?'
        };

        modalService.showModal({}, modalOptions)
        .then(function () {
			var duplicateItem = angular.copy(self.selectedEntity, {});
			delete duplicateItem.boh_id;
			masterDataSvc.create(undefined, duplicateItem)
				.then(function(newItem){
					$stateParams.boId = newItem.boh_id;
					$log.debug('Buisness Object duplicated successfully');
					Notifications.createMessageSuccess('Buisness Object duplicated successfully');
					$state.go($state.current, $stateParams, {reload: true, location:true, inherit: true});
				}, function(reason){
					handleServiceError('Duplicating Buisness Object failed', reason);
					$state.go('^', $stateParams, {reload: true});
				});        	
    	});
	};
	
	this.deleteItem = function() {
		var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Delete entity',
            headerText: 'Delete "' + self.selectedEntity.boh_name + '"?',
            bodyText: 'Are you sure you want to delete this entity?'
        };

        modalService.showModal({}, modalOptions)
        .then(function () {
			masterDataSvc.remove(self.selectedEntity.boh_id, true)
			.then(function(){
				delete $stateParams.boId;			
				$log.debug('Buisness Object deleted successfully');
				Notifications.createMessageSuccess('Buisness Object deleted successfully.');				
			})
			.catch(function(reason){
				handleServiceError('Deleting Buisness Object failed', reason);
			})
			.finally(function(){
				$state.go('^', $stateParams, {reload: true, inheirt: false});
			});
    	
    	});
	};
	
}])
