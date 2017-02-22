(function(angular){
"use strict";

angular.module('businessObjects')
.controller('DetailsCtrl', ['masterDataSvc', 'modalService', 'Notifications', 'selectedEntity', '$log', '$state', '$stateParams', 'Relation', function (masterDataSvc, modalService, Notifications, selectedEntity, $log, $state, $stateParams, Relation) {
	
	this.selectedEntity = selectedEntity;
	var self = this;
	
	this.pk = this.selectedEntity.properties.filter(function(prop){
			return prop.pk;
		})[0];
	
	this.showProperties = function(){
		this.propertyItems = this.selectedEntity.properties.filter(function(prop){
			return !prop.pk;
		});
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
		this.inboundRelations = getInboundRelations.apply(self);
		this.outboundRelations = getOutboundRelations.apply(self);
	};
	
	function getInboundRelations(){
		if(this.selectedEntity){
			/*Relation.query({
				targetId: this.selectedEntity.name
			}).$promise
			.then(function(relations){
				self.inboundRelations = relations.map(function(relation){
					masterDataSvc.getByName(relation.srcEntityName, true)
					.then(function(srcEntity){
						relation.source = srcEntity;
						return relation;						
					});
					return relation;					
				});
			});*/
			return this.selectedEntity['inbound-relations']
			.map(function(rel){
				var inboundEntity = this.selectedEntity['inbound-entities']
									.filter(function(inboundEntity){
										return inboundEntity.name === rel.targetEntityName;
									})[0];
				rel.source = inboundEntity;
				return rel;
			}.bind(this));
		}
	}
	
	function getOutboundRelations(){
		return this.selectedEntity['outbound-relations']
				.map(function(rel){
					masterDataSvc.getByName(rel.targetEntityName, true)
					.then(function(targetEntity){
						rel.target = targetEntity;
					});
					return rel;
				});
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
            headerText: 'Duplicate "' + self.selectedEntity.label + '"?',
            bodyText: 'Are you sure you want to duplicate this entity?'
        };

        modalService.showModal({}, modalOptions)
        .then(function () {
			var duplicateItem = angular.copy(self.selectedEntity, {});
			delete duplicateItem.id;
			duplicateItem.properties = duplicateItem.properties.map(function(item){
				delete item.id;
				delete item.entityName;
				return item;
			});
			masterDataSvc.create(undefined, duplicateItem)
				.then(function(newItem){
					$stateParams.boId = newItem.id;
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
            headerText: 'Delete "' + self.selectedEntity.label + '"?',
            bodyText: 'Are you sure you want to delete this entity?'
        };

        modalService.showModal({}, modalOptions)
        .then(function () {
			masterDataSvc.remove(self.selectedEntity.id, true)
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
