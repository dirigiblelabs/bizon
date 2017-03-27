(function(angular){
"use strict";

angular.module('businessObjects')
.service('RelationsEditor', ['Relations', 'SQLEntity', 'masterDataSvc', 'Utils', function(Relations, SQLEntity, MasterDataSvc, Utils){
	var tableNameFromLabel = function(entity){
		return SQLEntity.formatTableName(entity.label);
	};
	var generateTargetEntityKeyColumn = function(relation){
		return relation.source.table + '_' + relation.srcKeyProperty.column;
	};
	var newTargetKeyProperty = function(relation){
		var column = generateTargetEntityKeyColumn(relation);
		var targetJoinProperty = {
			"name": Utils.randomAlphanumeric(),
			"label": SQLEntity.formatFieldName(column),
			"column": SQLEntity.formatFieldName(column),
			"typeLabel": relation.srcKeyProperty.typeLabel,
			"type": relation.srcKeyProperty.type,
			"size": relation.srcKeyProperty.size,
			"required": true,
			"fkInRelationName": relation.name,
			"entityName": relation.target?relation.target.name:undefined,
			"action": "save"
		};
		relation.targetEntityFkName = targetJoinProperty.name;
		relation.targetEntityKeyProperty = targetJoinProperty;
		return targetJoinProperty;
	};
	var generateJoinTableName = function(relation){
		relation.joinTableName = relation.source.table;
		if(relation.target && relation.target.table){
      		relation.joinTableName += '_' + relation.target.table;
  		}
  		return relation;
	};
	var generateJoinTableSrcKey = function(relation){	
		relation.joinTableSrcKey = relation.source.table + '_' + relation.srcKeyProperty.column;
		return relation;
	};
	var generateJoinTableTargetKey = function(relation){	
		relation.joinTableTargetKey = relation.target.table + '_' + (relation.targetEntityFkName?relation.targetEntityFkName:'');
		return relation;
	};

	var MULTIPLICITY_OPTS = Object.freeze({ONE:1, MANY:2});
	var MULTIPLICITY_TYPES = Object.freeze({ONE_TO_ONE:1, ONE_TO_MANY:2, MANY_TO_MANY:3});
	var ASSOCIATION_TYPES = Object.freeze({ASSOCIATION:1, COMPOSITION:2, AGGREGATION:3});		
	
 	var getRelationMultiplicity = function(relation){
 		var multiplicity;
		if(relation.srcMultiplicity === MULTIPLICITY_OPTS.ONE && relation.targetMultiplicity === MULTIPLICITY_OPTS.ONE){
      		multiplicity = MULTIPLICITY_TYPES.ONE_TO_ONE;
  		} else if(relation.srcMultiplicity === MULTIPLICITY_OPTS.ONE && relation.targetMultiplicity === MULTIPLICITY_OPTS.MANY){
  		 	multiplicity = MULTIPLICITY_TYPES.ONE_TO_MANY;
  		} else if(relation.srcMultiplicity === MULTIPLICITY_OPTS.MANY && relation.targetMultiplicity === MULTIPLICITY_OPTS.MANY){
  			multiplicity = MULTIPLICITY_TYPES.MANY_TO_MANY;
  		}
  		return multiplicity;
    };
    
    var setRelationMultiplicity = function(multiplicity, relation){
    	if(multiplicity === MULTIPLICITY_TYPES.ONE_TO_ONE){
      		relation.srcMultiplicity = MULTIPLICITY_OPTS.ONE;
      		relation.targetMultiplicity = MULTIPLICITY_OPTS.ONE;
  		} else if(multiplicity === MULTIPLICITY_TYPES.ONE_TO_MANY){
  			relation.srcMultiplicity = MULTIPLICITY_OPTS.ONE;
      		relation.targetMultiplicity = MULTIPLICITY_OPTS.MANY;
  		} else if(multiplicity === MULTIPLICITY_TYPES.MANY_TO_MANY){
  			relation.srcMultiplicity = MULTIPLICITY_OPTS.MANY;
      		relation.targetMultiplicity = MULTIPLICITY_OPTS.MANY;
			if(!relation.source.table)
				relation.source.table = tableNameFromLabel(relation.source);
	    	if(relation.target && !relation.target.table)
	    		relation.target.table = tableNameFromLabel(relation.target);
	  		if(!relation.joinTableName){
	      		generateJoinTableName(relation);
	  		}
	  		if(!relation.joinTableSrcKey){
	      		generateJoinTableSrcKey(relation);
	  		}
	  		if(!relation.joinTableTargetKey){
	      		generateJoinTableTargetKey(relation);
	  		}      		
  		}
    };
	
	var setRelationAssociationType = function(type, relation){
		//No need to handle for now
	};
	
	var newRelation = function(sourceEntity){
		var rel= {
			srcEntityName: sourceEntity.name,
			srcEntityLabel: sourceEntity.label,
			srcMultiplicity: MULTIPLICITY_OPTS.ONE,
			name: Utils.randomAlphanumeric(),
			label: sourceEntity.label +' to',
			source: Relations.relatedEntitySubset(sourceEntity),
		};
		rel.srcKeyProperty = sourceEntity.properties
							 .filter(function(prop){
								return prop.pk === true; 
							  })[0];
		rel.srcKey = rel.srcKeyProperty.name;
		newTargetKeyProperty(rel);
		return rel;
	};
	var setRelationTarget = function(relation){
		if(relation.targetEntityName) {
			if(!relation.target || (relation.target && relation.target.name!==relation.targetEntityName)){
				MasterDataSvc.getByName(relation.targetEntityName, true)
				.then(function(loadedTargetEntity){
					relation.target = Relations.relatedEntitySubset(loadedTargetEntity);
					relation.targetEntityKeyProperty = Relations.getTargetEntityKeyProperty();
				}.bind(this));
			}
		} else {
			//delete target dependent properties
			delete relation.target;
			delete relation.targetEntityFkName;
			delete relation.targetMultiplicity;
			delete relation.joinTableTargetKey;
		}
	};
	var initRelation = function(relation, sourceEntity){
		if(relation === undefined) {
			relation = newRelation(sourceEntity);
		} else {
			if(relation.target === undefined && relation.targetEntityName)
				setRelationTarget(relation);
		}
		return relation;
	};
	var getTargetKeyOptions = function(relation){
		return relation.target.properties
				.filter(function(prop){
					return prop.type === relation.srcKeyProperty.type && prop.pk === false;//TODO: filter also those that are already assigned ot anothe relation
				}.bind(this));
	};
	var upsertRelation = function(relation, sourceEntity){
		var targetJoinProperty;
		if(relation.id === undefined){
			relation.action = 'save';
			sourceEntity['outbound-relations'].push(relation); 
			targetJoinProperty = relation.targetEntityKeyProperty;
			relation.target.properties.push(targetJoinProperty);
		} else {
			if(relation.action!=='save')
				relation.action = 'update';
			targetJoinProperty = Relations.getTargetEntityKeyProperty(relation);
			if(targetJoinProperty && targetJoinProperty.id!==undefined){
				//check if the join property in this relation changed and link the new name to the old property name, if necessary
				//no changes except related to source key type changes will be attempted to preserve user changes, if any
				if(targetJoinProperty.name !== relation.targetEntityFkName){
					targetJoinProperty.name = relation.targetEntityFkName;
					targetJoinProperty.action = "update";
				}
				if(targetJoinProperty.type !== relation.srcKeyProperty.type){
					targetJoinProperty.type = relation.srcKeyProperty.type;
					targetJoinProperty.typeLabel = relation.srcKeyProperty.typeLabel;
					targetJoinProperty.size = relation.srcKeyProperty.size;
					targetJoinProperty.action = "update";
				}
			}				
			sourceEntity['outbound-relations'] = sourceEntity['outbound-relations']
													.map(function(rel){
														if(rel.id === relation.id){
															return relation;
														}
														return rel;
													}.bind(this));
		}
	};
	
	var RelationsEditor = Relations;
	RelationsEditor.MULTIPLICITY_OPTS = MULTIPLICITY_OPTS;
	RelationsEditor.MULTIPLICITY_TYPES = MULTIPLICITY_TYPES;
	RelationsEditor.ASSOCIATION_TYPES = ASSOCIATION_TYPES;
	RelationsEditor.getRelationMultiplicity = getRelationMultiplicity;
	RelationsEditor.setRelationMultiplicity = setRelationMultiplicity;
	RelationsEditor.setRelationTarget = setRelationTarget;
	RelationsEditor.initRelation = initRelation;
	RelationsEditor.getTargetKeyOptions = getTargetKeyOptions;
	RelationsEditor.upsert = upsertRelation;
	RelationsEditor.newTargetKeyProperty = newTargetKeyProperty;
	RelationsEditor.setRelationAssociationType = setRelationAssociationType;
	
	return RelationsEditor;
}])
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
	      {value: RelationsEditor.MULTIPLICITY_TYPES.ONE_TO_MANY, legend: 'One-To-Many'},
	      {value: RelationsEditor.MULTIPLICITY_TYPES.MANY_TO_MANY, legend: 'Many-to-Many'}
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
			this.slider.value = RelationsEditor.getRelationMultiplicity(relation);
			this.targetKeyOptions = RelationsEditor.getTargetKeyOptions(relation);
		}
		this.targetKeyFilterText = (this.relation.targetEntityKeyProperty && this.relation.targetEntityKeyProperty.column) || RelationsEditor.getTargetEntityKeyProperty(this.relation).column;		
		//this.sourceKeyOptions.selection = RelationsEditor.getSourceEntityKeyProperty(this.relation);//No
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
	
	this.onSourceKeyChange = function(sourceKeyProperty){
		this.relation.srcKey = sourceKeyProperty.name;
		//TODO: check if the type of the target key (if any) is still compatible and raise a warning if not
	};

	//target entity selection handler
	this.changeTarget = function($item, $model){
		if(this.relation.target){
			this.relation.targetEntityName = $item.name;
			this.targetKeyOptions.options = RelationsEditor.getTargetKeyOptions(this.relation);
			if(this.relation.targetEntityKeyProperty){
				this.targetKeyOptions.options.push(this.relation.targetEntityKeyProperty);
				this.targetKeyFilterText = this.relation.targetEntityKeyProperty.column;
				this.relation.targetEntityKeyProperty.entityName = this.relation.target.name;
			}
		}
	};
	
	this.onTargetKeySelect = function($item, $model){
		this.targetKeyFilterText = $item;
		if(this.relation.target){
			this.relation.targetEntityKeyProperty = this.relation.targetEntityKeyProperty || RelationsEditor.getTargetEntityKeyProperty(this.relation);
			this.relation.targetEntityFkName = this.relation.targetEntityKeyProperty.name;
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
