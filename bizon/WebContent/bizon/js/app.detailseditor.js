angular.module('businessObjects')
.controller('EditCtrl', ['masterDataSvc', 'modalService', 'Notifications', 'selectedEntity', '$log', '$state', '$stateParams', function (masterDataSvc, modalService, Notifications, selectedEntity, $log, $state, $stateParams) {

	this.entityForEdit = $stateParams.entityForEdit;
	var self = this;
	var TABS = Object.freeze({PROP_TAB:0, REL_TAB:1});
	
	this.showProperties = function(){
		this.tab = TABS.PROP_TAB;
		if(this.entityForEdit.properties){
			this.propertyItems = this.entityForEdit.properties.filter(function(v){
				if(v.action==='remove' || !v.boi_type || v.boi_type!=='Relationship'){
					return true;
				}
				return false;
			}, this);
		}
	};
	
	function showDetails(item){
		if(item){
			this.showProperties.apply(this);//Initial content to show	
		}
	}
	
	showDetails.apply(this, [this.entityForEdit]);
	
	this.showRelationships = function(){
		this.tab = TABS.REL_TAB;	
		if(this.entityForEdit.properties){
			this.propertyItems = this.entityForEdit.properties.filter(function(v){
				if(v.action==='remove' || (v.boi_type && v.boi_type==='Relationship')){
					return true;
				}
				return false;
			}, this);
		}
	};
	
	this.openPropertyEditor = function(item){
		if(this.tab === TABS.PROP_TAB){
			$state.go('list.entity.edit.items', {
				entityForEdit: this.entityForEdit,
				item: item
			}, {location: false});			
		} else if(this.tab === TABS.REL_TAB){
			$state.go('list.entity.edit.relations', {
				entityForEdit: this.entityForEdit,
				item: item
			}, {location: false});
		}
	};
	
	this.deleteProperty = function(item){
		var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Delete',
            headerText: 'Delete property "' + (item.boi_name||item.bor_name) + '"?',
            bodyText: 'Are you sure you want to delete this property?'
        };
        
        modalService.showModal({}, modalOptions)
        .then(function () {
			for(var i=0; i< self.propertyItems.length; i++){
				if(self.propertyItems[i] === item){
					self.propertyItems.splice(i,1);
					break;
				}
			}
			self.entityForEdit.properties = self.entityForEdit.properties.map(
				function(currItem){
					if((currItem.boi_id && currItem.boi_id === item.boi_id) || (currItem.bor_id && currItem.bor_id === item.bor_id)){
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
            headerText: 'Changes will be lost. Cancel editing "' + self.entityForEdit.boh_name + '"?',
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

	    masterDataSvc.update($stateParams.entityForEdit)
	    .then(function(){
			$log.debug('Buisness Object updated successfully');
			Notifications.createMessageSuccess('Buisness Object updated successfully.');					    
			$stateParams.boId = self.entityForEdit.boh_id;
			$stateParams.selectedEntity = self.entityForEdit;
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
