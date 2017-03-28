(function(angular){
"use strict";

angular.module('businessObjects')
.service('Relations', ['masterDataSvc', 'Entity', '$q', function(MasterDataService, Entity, $q){
	var relatedEntitySubset = function(entity){
		return {
			"id": entity["id"],
			"name": entity["name"],
			"label": entity["label"],
			"table": entity["table"],
			"properties": entity["properties"]
		};
	};				
	var getSourceEntityKeyProperty = function(relation){
		return relation.source.properties
				.find(function(prop){
					return relation.srcPropertyName === prop.name;
				}.bind(this));
	};
	var getRelationTargetEntity = function(relation){
		var targetEntity;
		if(relation.targetEntityName){
			if(relation.target && relation.target.name === relation.targetEntityName){
				targetEntity = relation.target;
			} else {
				//first try loaded entities
				targetEntity = MasterDataService.getByName(relation.targetEntityName, false)
								.then(function(loadedTargetEntity){
									if(!loadedTargetEntity){
										//if the required entity is still not loaded, look it up remotely without affecting the local entity cache
										var params = {"name":relation.targetEntityName, "$filter":"name", "$expand": "properties"};
										return Entity.queryByProperty(params).$promise
												.then(function(_loadedTargetEntities){
													var _loadedTargetEntity = _loadedTargetEntities[0];
													if(!_loadedTargetEntity)
														return;
													return relatedEntitySubset(_loadedTargetEntity);
												}.bind(this));
									}
									return relatedEntitySubset(loadedTargetEntity);
								}.bind(this));
			}
		}
		return $q.when(targetEntity);
	};
	
	var setRelationTargetEntity = function(relation, targetEntity){
		if(targetEntity)
			relation.target = relatedEntitySubset(targetEntity);
		else
			getRelationTargetEntity(relation)
			.then(function(targetEntity){
				if(targetEntity){
					relation.target = targetEntity;
					relation.targetEntityKeyProperty = getTargetEntityKeyProperty(relation);
				} else {
					//delete target dependent properties if any
					delete relation.target;
					delete relation.targetPropertyName;
					delete relation.targetMultiplicity;
					delete relation.joinEntityTargetPropertyName;
				}
				return targetEntity;
			}.bind(this));
	};
	var getRelationSourceEntity = function(relation){
		var sourceEntity;
		if(relation.srcEntityName){
			if(relation.source && relation.source.name === relation.srcEntityName){
				sourceEntity = relation.source;
			} else {
				//first try loaded entities
				sourceEntity = MasterDataService.getByName(relation.srcEntityName, false)
								.then(function(loadedSourceEntity){
									if(!loadedSourceEntity){
										return;
									} else {
										return relatedEntitySubset(loadedSourceEntity);
									}
								}.bind(this))
								.then(function(loadedSourceEntity){
									if(loadedSourceEntity)
										return loadedSourceEntity;
										
									//if the required entity is still not loaded, look it up remotely without affecting the local entity cache
									var params = {"name":relation.srcEntityName, "$filter":"name", "$expand": "properties"};
									return Entity.queryByProperty(params).$promise
											.then(function(_loadedSourceEntities){
												var _loadedSourceEntity = _loadedSourceEntities[0];
												if(!_loadedSourceEntity)
													return;
												return relatedEntitySubset(_loadedSourceEntity);
											}.bind(this));
								}.bind(this))
								.then(function(loadedSourceEntity){
									relation.source = loadedSourceEntity;
									relation.srcEntityKeyProperty = getSourceEntityKeyProperty(relation);
								}.bind(this));
			}
		}
		return sourceEntity;
	};
	var setRelationSourceEntity = function(relation, sourceEntity){
		relation.source = sourceEntity?relatedEntitySubset(sourceEntity):undefined || getRelationSourceEntity(relation);
		if(!relation.srcEntityKeyProperty){
			if(relation.source['$$state'] && !relation.source['$$state'].status){
				relation.source
				.finally(function(){
					relation.srcEntityKeyProperty = getSourceEntityKeyProperty(relation);
				});
			} else {
				relation.srcEntityKeyProperty = getSourceEntityKeyProperty(relation);
			}
		}
	};
	var getTargetEntityKeyProperty = function(relation){
		return relation.target.properties.find(function(prop){
					return relation.targetPropertyName === prop.name;
				}.bind(this));
	};
	var getJoinEntity = function(relation){
		var entityPromise;
		if(relation.joinEntity){
			entityPromise = $q.when(relation.joinEntity).$promise;
		} else {
			entityPromise = MasterDataService.getByName(relation.joinEntityName)
				.then(function(entity){
					return entity;
				}.bind(this));
		}
		return entityPromise;
	};
	var getJoinEntitySourceKeyProperty = function(relation){
		return getJoinEntity(relation)
				.then(function(joinEntity){
					return joinEntity.properties
							.find(function(prop){
								return prop.name === relation.joinEntitySrcPropertyName;
							}.bind(this));
				}.bind(this));
	};
	var getJoinEntityTargetKeyProperty = function(relation){
		return getJoinEntity(relation)
				.then(function(joinEntity){
					return joinEntity.properties
							.find(function(prop){
								return prop.name === relation.joinEntityTargetPropertyName;
							}.bind(this));
				}.bind(this));
	};
	
	var decorateRelation = function(relation, sourceEntity, targetEntity){
		setRelationSourceEntity(relation, sourceEntity);
		setRelationTargetEntity(relation, targetEntity);
		return relation;
	};
	
	return {
		relatedEntitySubset: relatedEntitySubset,
		decorateRelation: decorateRelation,
		getRelationTargetEntity: getRelationTargetEntity,
		setRelationTargetEntity: setRelationTargetEntity,
		getRelationSourceEntity: getRelationSourceEntity,
		setRelationSourceEntity: setRelationSourceEntity,
		getSourceEntityKeyProperty: getSourceEntityKeyProperty,
		getTargetEntityKeyProperty: getTargetEntityKeyProperty,
		getJoinEntity: getJoinEntity,
		getJoinEntitySourceKeyProperty: getJoinEntitySourceKeyProperty,
		getJoinEntityTargetKeyProperty: getJoinEntityTargetKeyProperty
	};
}])
.service('RelationsEditor', ['Relations', 'SQLEntity', 'masterDataSvc', 'Utils', function(Relations, SQLEntity, MasterDataSvc, Utils){
	var tableNameFromLabel = function(entity){
		return SQLEntity.formatTableName(entity.label);
	};
	var generateTargetEntityKeyColumn = function(relation){
		return relation.source.table + '_' + relation.srcEntityKeyProperty.column;
	};
	var newTargetKeyProperty = function(relation){
		var column = generateTargetEntityKeyColumn(relation);
		var targetJoinProperty = {
			"name": Utils.randomAlphanumeric(),
			"label": SQLEntity.formatFieldName(column),
			"column": SQLEntity.formatFieldName(column),
			"typeLabel": relation.srcEntityKeyProperty.typeLabel,
			"type": relation.srcEntityKeyProperty.type,
			"size": relation.srcEntityKeyProperty.size,
			"required": true,
			"managingRelationName": relation.name,
			"entityName": relation.target?relation.target.name:undefined,
			"action": "save"
		};
		relation.targetPropertyName = targetJoinProperty.name;
		relation.targetEntityKeyProperty = targetJoinProperty;
		return targetJoinProperty;
	};
	var generateJoinEntityName = function(relation){
		relation.joinEntityName = relation.source.table;
		if(relation.target && relation.target.table){
      		relation.joinEntityName += '_' + relation.target.table;
  		}
  		return relation;
	};
	var generateJoinEntitySrcPropertyName = function(relation){	
		relation.joinEntitySrcPropertyName = relation.source.table + '_' + relation.srcEntityKeyProperty.column;
		return relation;
	};
	var generateJoinEntityTargetPropertyName = function(relation){
		if(relation.target && relation.target.table)
			relation.joinEntityTargetPropertyName = relation.target.table + '_' + (relation.targetPropertyName?relation.targetPropertyName:'');
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
	  		if(!relation.joinEntityName){
	      		generateJoinEntityName(relation);
	  		}
	  		if(!relation.joinEntitySrcPropertyName){
	      		generateJoinEntitySrcPropertyName(relation);
	  		}
	  		if(!relation.joinEntityTargetPropertyName){
	      		generateJoinEntityTargetPropertyName(relation);
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
		rel.srcEntityKeyProperty = sourceEntity.properties
							 .filter(function(prop){
								return prop.isPrimaryKey === true; 
							  })[0];
		rel.srcPropertyName = rel.srcEntityKeyProperty.name;
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
			delete relation.targetPropertyName;
			delete relation.targetMultiplicity;
			delete relation.joinEntityTargetPropertyName;
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
					return prop.type === relation.srcEntityKeyProperty.type && prop.isPrimaryKey === false;//TODO: filter also those that are already assigned ot anothe relation
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
				if(targetJoinProperty.name !== relation.targetPropertyName){
					targetJoinProperty.name = relation.targetPropertyName;
					targetJoinProperty.action = "update";
				}
				if(targetJoinProperty.type !== relation.srcEntityKeyProperty.type){
					targetJoinProperty.type = relation.srcEntityKeyProperty.type;
					targetJoinProperty.typeLabel = relation.srcEntityKeyProperty.typeLabel;
					targetJoinProperty.size = relation.srcEntityKeyProperty.size;
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
}]);

})(angular);