(function(angular){
"use strict";

angular.module('businessObjects')
.controller('DetailsCtrl', ['masterDataSvc', 'modalService', 'Notifications', 'selectedEntity', '$log', '$state', '$stateParams', 'Relation', function (masterDataSvc, modalService, Notifications, selectedEntity, $log, $state, $stateParams, Relation) {
	
	this.selectedEntity = selectedEntity;
	var self = this;
	
	this.showProperties = function(){
		if(this.selectedEntity.properties){
			this.propertyItems = this.selectedEntity.properties.filter(function(v){
				if(!v.boi_type || v.boi_type!=='Relationship'){
					return true;
				}
				return false;
			}, this);
		}
	};
	
	function showDetails(item){
		this.searchText = undefined;
		if(item){
			this.showProperties.apply(this);//Initial content to show	
		}
	}
	
	showDetails.apply(this, [this.selectedEntity]);
	
	this.showRelationships = function(){
		this.searchText = undefined;
		getInboundRelations.apply(self);
		getOutboundRelations.apply(self);		
	};
	
	function getInboundRelations(){
		if(this.selectedEntity){
			Relation.query({
				targetId: this.selectedEntity.boh_id
			}).$promise
			.then(function(relations){
				self.inboundRelations = relations.map(function(relation){
					masterDataSvc.get(relation.bor_src_id, true)
					.then(function(srcEntity){
						relation.source = srcEntity;
						return relation;						
					});
					return relation;					
				});
			});
		}
	}
	
	function getOutboundRelations(){
		if(this.selectedEntity){
			Relation.query({
				srcId: this.selectedEntity.boh_id
			}).$promise
			.then(function(relations){
				self.outboundRelations = relations.map(function(relation){
					masterDataSvc.get(relation.bor_target_id, true)
					.then(function(targetEntity){
						relation.target = targetEntity;
					});
					return relation;	
				});
			});
		}
	}
	
	this.showConfig = function(){
		this.searchText = undefined;
	};
	
	function handleServiceError(text, errorPayload){
		var message = masterDataSvc.serviceErrorMessageFormatter(text, errorPayload);
		$log.error(message);
		Notifications.createMessageError(message);						
	}
	
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
			duplicateItem.properties = duplicateItem.properties.map(function(item){
				delete item.boi_id;
				delete item.bor_id;
				delete item.boi_boh_id;
				return item;
			});
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
	
	this.filterConfigurationEntries = function(expression, cfgEntry){
		return !expression || cfgEntry.indexOf(expression)>-1;
	};
	
}]);
})(angular);