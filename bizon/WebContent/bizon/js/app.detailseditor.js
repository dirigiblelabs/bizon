angular.module('businessObjects')
.controller('EditCtrl', ['masterDataSvc', 'modalService', 'selectedEntity', '$log', '$state', '$stateParams', function (masterDataSvc, modalService, selectedEntity, $log, $state, $stateParams) {

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
	
	showDetails.apply(this, this.selectedEntity);
	
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
	
	this.openPropertyEditor = function(item){
		$state.go('list.entity.edit.items', {
			selectedEntity: this.selectedEntity,
			item: item
		}, {location: false});
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
	    	$stateParams.message = {
					text: 'Business object updated successfully',
					type: 'alert-success'
			};
			$stateParams.boId = self.selectedEntity.boh_id;
			$stateParams.selectedEntity = self.selectedEntity;
			$state.go('^', $stateParams, {reload: 'list', location:false, inherit: false});
    	})
    	.catch(function(reason){
    		var message = masterDataSvc.serviceErrorMessageFormatter('Updating Buisness Object failed', reason);
			$log.error(message);
			$stateParams.message = {
					text: message,
					type: 'alert-danger'
			};
			$state.go($state.current, $stateParams, {reload: false});
		});	  
	};
			
}])
