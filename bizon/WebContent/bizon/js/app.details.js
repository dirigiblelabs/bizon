(function(angular){
"use strict";

angular.module('businessObjects')
.controller('DetailsCtrl', ['masterDataSvc', 'modalService', 'Notifications', 'selectedEntity', '$log', '$state', '$stateParams', 'Relation', 'Relations', 'Settings', function (masterDataSvc, modalService, Notifications, selectedEntity, $log, $state, $stateParams, Relation, Relations, Settings) {
	
	this.selectedEntity = selectedEntity;
	this.app = Settings;
	var self = this;
	
	this.isPrimaryKey = this.selectedEntity.properties.filter(function(prop){
			return prop.isPrimaryKey;
		})[0];
		
	var decorateProperty = function(prop){
		if(prop.managingRelationName && !prop.managingRelation){
			var rel = this.selectedEntity['inbound-relations']
						.find(function(inboundRel){
							return inboundRel.name === prop.managingRelationName; 
						});
			if(rel){
				prop.managingRelation = {};
				prop.managingRelation.name = rel.label;
				var defEntity = this.selectedEntity['inbound-entities']
									.find(function(inboundEntity){
										return inboundEntity.name === rel.srcEntityName; 
									});
				if(defEntity){
					prop.managingRelation.entityId = defEntity.id;
					prop.managingRelation.entityLabel = defEntity.label;
				}
			}
		}
		return prop;
	};
	
	this.showProperties = function(){
		this.propertyItems = this.selectedEntity.properties.map(decorateProperty.bind(this));
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
		if(this.selectedEntity){
			this.inboundRelations = this.selectedEntity['inbound-relations']
										.map(function(rel){
											return Relations.decorateRelation(rel);
										}.bind(this));
			this.outboundRelations = this.selectedEntity['outbound-relations']
										.map(function(rel){
											return Relations.decorateRelation(rel);
										}.bind(this));
		}
	};

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
	    $state.go("list.entity.edit", $stateParams);
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
	
	this.formatType = function(prop, expertMode){
		if(prop.type==='VARCHAR'){
			if(expertMode){
				return prop.type + ' [' + prop.size + ']';
			}
			var sizeText = "Medium";
			if(prop.size<41)
				sizeText = "Small";
			else if(prop.size>255)
				sizeText = "Huge";
			return sizeText + ' ' + prop.typeLabel;
		}
		return expertMode===true?prop.type:prop.typeLabel;
	};
	
}]);
})(angular);
