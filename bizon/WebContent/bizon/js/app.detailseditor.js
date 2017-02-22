(function(angular){
"use strict";

angular.module('businessObjects')
.controller('EditCtrl', ['masterDataSvc', 'modalService', 'Notifications', 'selectedEntity', '$log', '$state', '$stateParams', function (masterDataSvc, modalService, Notifications, selectedEntity, $log, $state, $stateParams) {

	this.entityForEdit = $stateParams.entityForEdit || JSON.parse(JSON.stringify(selectedEntity));
	var self = this;
	var TABS = Object.freeze({PROP_TAB:0, REL_TAB:1, CONF_TAB:2});
	
	this.showProperties = function(){
		this.searchText = undefined;	
		this.tab = TABS.PROP_TAB;
		if(this.entityForEdit.properties){
			this.propertyItems = this.entityForEdit.properties.filter(function(v){
				if(v.action!=='remove'){
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
		this.searchText = undefined;
		this.tab = TABS.REL_TAB;	
		this.propertyItems = this.entityForEdit['outbound-relations'].filter(function(v){
			if(v.action!=='remove') {
				return true;
			}
			return false;
		}, this);
	};
	
	this.showConfig = function(){
		this.tab = TABS.CONF_TAB;
		this.searchText = undefined;
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
				relation: item
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
					if(item.boi_id===undefined && item.bor_id===undefined && currItem === item){
						return;
					}
					if((currItem.boi_id && currItem.boi_id === item.boi_id) || (currItem.bor_id && currItem.bor_id === item.bor_id)){
						currItem.action = 'remove';
					}
					return currItem;
				}).filter(function(n){ return n != undefined; });
        });
        
	};
	
	this.cancelEdit = function() { 
		var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'OK',
            headerText: 'Changes will be lost. Cancel editing "' + self.entityForEdit.boh_label + '"?',
            bodyText: 'Are you sure you want to cancel your changes?'
        };

        modalService.showModal({}, modalOptions)
        .then(function () {
			delete $stateParams.entityForEdit;			
		    $state.go('list.entity', {boId:self.entityForEdit.boh_id});
        });
	};
	
	this.saveItem = function() {
	    masterDataSvc.update(self.entityForEdit)
	    .then(function(){
			$log.debug('Buisness Object updated successfully');
			Notifications.createMessageSuccess('Buisness Object updated successfully.');
			$state.go('list.entity', {boId: self.entityForEdit.boh_id}, {reload:true});
    	})
    	.catch(function(reason){
    		var message = masterDataSvc.serviceErrorMessageFormatter('Updating Buisness Object failed', reason);
			$log.error(message);
			Notifications.createMessageError(message);    		
			$state.go($state.current, $stateParams, {reload: false});
		});	  
	};

	this.filterConfigurationEntries = function(expression, cfgEntry){
		return !expression || cfgEntry.indexOf(expression)>-1;
	};

	this.typeOptions = [{id:0, val:'INTEGER'},{id:1, val:'VARCHAR'},{id:2, val:'BIGINT'}];
	
	//FIXME
	this.cfgDataTypeSelectedTypeOption = this.typeOptions.find(function(opt){
			return true;//opt.val.toLowerCase() === self.entityForEdit.boh_id_datatype_code.toLowerCase();
		});
	
	this.cfgDataTypeSelectionChanged = function(option){
		this.cfgDataTypeSelectedTypeOption = this.typeOptions.find(function(opt){
			return opt.id === option.id;
		});
		this.entityForEdit.boh_id_datatype_code = this.cfgDataTypeSelectedTypeOption.val;
	};
			
}]);
})(angular);
