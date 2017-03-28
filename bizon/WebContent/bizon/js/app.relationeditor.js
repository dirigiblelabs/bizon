(function(angular){
"use strict";

angular.module('businessObjects')
.controller('RelationEditorCtrl', ['RelationsEditor', '$scope', 'masterDataSvc', '$log', 'selectedEntity', 'relation', 'Settings', function(RelationsEditor, $scope, masterDataSvc, $log, selectedEntity, relation, Settings) {
	this.RelationsEditor = RelationsEditor;
	this.app = Settings;
	this.relation = angular.copy(relation);
	this.sourceKeyOptions = {
		options: selectedEntity.properties
	};
	this.targetKeyOptions = {};
	this.loading = false;
	this.noResults;

	this.slider = {
	  options: {
	  	showTicksValues: true,
		floor: 1,
	    ceil: 3,
	    stepsArray: [
	      {value: RelationsEditor.MULTIPLICITY_TYPES.ONE_TO_ONE, legend: 'One-to-One'},
	      {value: RelationsEditor.MULTIPLICITY_TYPES.ONE_TO_MANY, legend: 'One-To-Many'}/*,
	      {value: RelationsEditor.MULTIPLICITY_TYPES.MANY_TO_MANY, legend: 'Many-to-Many'}*/
	    ],
	    onEnd: function(){
	    	RelationsEditor.setRelationMultiplicity(this.slider.value, this.relation);
		}.bind(this)
	  }
	};
	this.relTypeSlider = {
	  options: {
	  	showTicksValues: true,
		floor: 1,
	    ceil: 3,
	    stepsArray: [
	      {value: RelationsEditor.ASSOCIATION_TYPES.ASSOCIATION, legend: 'Association'},
	      {value: RelationsEditor.ASSOCIATION_TYPES.AGGREGATION, legend: 'Aggregation'},
	      {value: RelationsEditor.ASSOCIATION_TYPES.COMPOSITION, legend: 'Composition'}
	    ],
		onEnd: function(){
	    	RelationsEditor.setRelationAssociationType(this.relTypeSlider.value, this.relation);
		}.bind(this)	    
	  }
	};
		
	var self = this;

	function init(){
		this.relation = RelationsEditor.initRelation(relation, selectedEntity);
		if(this.relation.target){
			this.targetFilterText = this.relation.target.label;
			this.slider.value = RelationsEditor.getRelationMultiplicity(relation);
			this.targetKeyOptions.options = RelationsEditor.getTargetKeyOptions(relation);
		}
		this.targetKeyFilterText = (this.relation.targetEntityKeyProperty && this.relation.targetEntityKeyProperty.column) || RelationsEditor.getTargetEntityKeyProperty(this.relation).column;		
		this.sourceKeyOptions.selection = this.relation.srcEntityKeyProperty;
		$scope.$$postDigest(function () {
			$scope.$broadcast('rzSliderForceRender');
		});	
	}
	
	//type-ahead options list function for target entity selection
	this.matchTargets = function(name){
		self.loading = true;
		return masterDataSvc.findByName(name, 'properties')
		.then(function(targets){
			if(!targets || targets.length===0)
				self.noResults = true;
			else
				self.noResults = false;
			return targets.map(function(entity){
						return RelationsEditor.relatedEntitySubset(entity);
					});
		})
		.catch(function(err){
			$log.error(err);
		})
		.finally(function(){
			self.loading = false;
		});
	};
	
	this.getTargetPropertiesColumnNames = function(){
		var props = [];
		if(this.relation.target){
			props = this.relation.target.properties
					.filter(function(prop){
						return this.relation.name !== prop.managingRelationName;
					}.bind(this))
					.map(function(prop){
						return prop.column;
					});
		}
		return props;
	};
	
	this.onSourceKeyChange = function(sourceKeyProperty){
		this.relation.srcPropertyName = sourceKeyProperty.name;
		//TODO: check if the type of the target key (if any) is still compatible and raise a warning if not
	};

	//target entity selection handler
	this.changeTarget = function($item, $model){
		this.relation.target = $item;
		this.relation.targetEntityName = $item.name;
		this.targetKeyOptions.options = RelationsEditor.getTargetKeyOptions(this.relation);
		if(this.relation.targetEntityKeyProperty){
			this.targetKeyOptions.options.push(this.relation.targetEntityKeyProperty);
			this.targetKeyFilterText = this.relation.targetEntityKeyProperty.column;
			this.relation.targetEntityKeyProperty.entityName = this.relation.target.name;
		}
	};
	
	this.onTargetKeySelect = function($item, $model){
		this.targetKeyFilterText = $item;
		if(this.relation.target){
			this.relation.targetEntityKeyProperty = this.relation.targetEntityKeyProperty || RelationsEditor.getTargetEntityKeyProperty(this.relation);
			this.relation.targetPropertyName = this.relation.targetEntityKeyProperty.name;
		}
	};
	
	this.onTargetKeyChange = function(){
		if(this.relation.targetEntityKeyProperty){
			this.relation.targetEntityKeyProperty.column = this.targetKeyFilterText;
			this.relation.targetEntityKeyProperty.action = 'update';
		}
	};
    
    this.cancel = function() {
   		$scope.$dismiss();
    };

    this.ok = function($event) {
    	if(angular.element($event.target).hasClass('disabled')){
    		$event.stopPropagation();
    		return;
    	}
  		RelationsEditor.upsert(this.relation, selectedEntity);
		$scope.$close(selectedEntity);
    };
    
    init.apply(this);
    
}]);
})(angular);
