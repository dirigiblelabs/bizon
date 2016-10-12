angular.module('businessObjects')
.controller('EditCtrl', ['masterDataSvc', 'modalService', 'Notifications', 'selectedEntity', '$log', '$state', '$stateParams', function (masterDataSvc, modalService, Notifications, selectedEntity, $log, $state, $stateParams) {

	this.selectedEntity = selectedEntity;
	var self = this;
	var TABS = Object.freeze({PROP_TAB:0, REL_TAB:1});
	
	this.showProperties = function(){
		this.tab = TABS.PROP_TAB;
		if(this._propertyItems){
			this.propertyItems = this._propertyItems.filter(function(v){
				if(!v.boi_type || v.boi_type!=='Relationship'){
					return true;
				}
				return false;
			}, this);
		}
	};
	
	function showDetails(item){
		if(item){
			this._propertyItems = item.properties;
			this.showProperties.apply(this);//Initial content to show	
		}
	}
	
	showDetails.apply(this, [this.selectedEntity]);
	
	this.showRelationships = function(){
		this.tab = TABS.REL_TAB;	
		if(this._propertyItems){
			this.propertyItems = this._propertyItems.filter(function(v){
				if(v.boi_type && v.boi_type==='Relationship'){
					return true;
				}
				return false;
			}, this);
		}
	};
	
	this.openPropertyEditor = function(item){
		if(this.tab === TABS.PROP_TAB){
			$state.go('list.entity.edit.items', {
				selectedEntity: this.selectedEntity,
				item: item
			}, {location: false});			
		} else if(this.tab === TABS.REL_TAB){
			$state.go('list.entity.edit.relations', {
				selectedEntity: this.selectedEntity,
				item: item
			}, {location: false});
		}
	};
	
	this.deleteProperty = function(item){
		var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Delete',
            headerText: 'Delete property "' + item.boi_name + '"?',
            bodyText: 'Are you sure you want to delete this property?'
        };
        
        modalService.showModal({}, modalOptions)
        .then(function () {
			for(var i=0; i< self.selectedEntity.properties.length; i++){
				if(self.selectedEntity.properties[i] === item){
					self.selectedEntity.properties.splice(i,1);
					break;
				}
			}
			$stateParams.entityForEdit.properties = $stateParams.entityForEdit.properties.map(
				function(currItem){
					if(currItem.boi_id && currItem.boi_id === item.boi_id){
						currItem.action = 'remove';
					}
					return currItem;
				});				
        });
        
	};
	
	this.cancelEdit = function() { 
		var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'OK',
            headerText: 'Changes will be lost. Cancel editing "' + self.selectedEntity.boh_name + '"?',
            bodyText: 'Are you sure you want to cancel your changes?'
        };

        modalService.showModal({}, modalOptions)
        .then(function () {
			delete $stateParams.boIdedit;
			delete $stateParams.entityForEdit;
		    $state.go('^', $stateParams);
        });
	};
	
	this.saveItem = function() {

	    masterDataSvc.update(this.selectedEntity)
	    .then(function(){
			$log.debug('Buisness Object updated successfully');
			Notifications.createMessageSuccess('Buisness Object updated successfully.');					    
			$stateParams.boId = self.selectedEntity.boh_id;
			$stateParams.selectedEntity = self.selectedEntity;
			$state.go('^', $stateParams, {reload: 'list', location:false, inherit: false});
    	})
    	.catch(function(reason){
    		var message = masterDataSvc.serviceErrorMessageFormatter('Updating Buisness Object failed', reason);
			$log.error(message);
			Notifications.createMessageError(message);    		
			$state.go($state.current, $stateParams, {reload: false});
		});	  
	};
			
}]);