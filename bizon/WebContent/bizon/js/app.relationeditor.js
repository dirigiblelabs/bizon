(function(angular){
"use strict";

angular.module('businessObjects')
.controller('RelationEditorCtrl', ['$scope', 'masterDataSvc', '$log', 'selectedEntity', 'relation', function($scope, masterDataSvc, $log, selectedEntity, relation) {
	
	this.relation = relation;
	
	this.loading = false;
	this.noResults;
	var MULTIPLICITY_TYPES = Object.freeze({ONE_TO_ONE:1, ONE_TO_MANY:2, MANY_TO_MANY:3, MANY_TO_ONE:4});	
	this.slider = {
	  options: {
	  	showTicksValues: true,
		floor: 1,
	    ceil: 3,
	    stepsArray: [
	      {value: MULTIPLICITY_TYPES.ONE_TO_ONE, legend: 'One-to-One'},
	      {value: MULTIPLICITY_TYPES.ONE_TO_MANY, legend: 'One-To-Many'},
	      {value: MULTIPLICITY_TYPES.MANY_TO_MANY, legend: 'Many-to-Many'}/*,
	      {value: MULTIPLICITY_TYPES.MANY_TO_ONE, legend: 'Many-to-One'}*/
	    ]
	  }
	};
	var ASSOCIATION_TYPES = Object.freeze({ASSOCIATION:1, COMPOSITION:2, AGGREGATION:2});		
	this.relTypeSlider = {
	  options: {
	  	showTicksValues: true,
		floor: 1,
	    ceil: 3,
	    stepsArray: [
	      {value: ASSOCIATION_TYPES.ASSOCIATION, legend: 'Association'},
	      {value: ASSOCIATION_TYPES.AGGREGATION, legend: 'Aggregation'},
	      {value: ASSOCIATION_TYPES.COMPOSITION, legend: 'Composition'}
	    ]
	  }
	};
	
	var MULTIPLICITY_OPTS = Object.freeze({ONE:1, MANY:2});
	var isNewProperty = relation === undefined ? true : false;
	
	var self = this;

	function init(){
		if(isNewProperty) {
			this.relation = {
				srcEntityName: selectedEntity.name,
				srcEntityLabel: selectedEntity.label,
				srcMultiplicity: MULTIPLICITY_OPTS.ONE,
				name: selectedEntity.name +'- '
			};
		} else {
			if(this.relation.targetEntityName){
				masterDataSvc.getByName(this.relation.targetEntityName, true)
				.then(function(target){
					this.relation.target = target;
				}.bind(this));
			}
			relationToSlider.apply(this, [this.relation, this.slider]);
		}
		this.relation.source = {
			label: selectedEntity.label,
			name: selectedEntity.name
		};		
		$scope.$$postDigest(function () {
			    $scope.$broadcast('rzSliderForceRender');
		});	
	}
	
	this.matchTargets = function(name){
		self.loading = true;
		return masterDataSvc.findByName(name)
		.then(function(targets){
			if(!targets || targets.length===0)
				self.noResults = true;
			else
				self.noResults = false;
			return targets;
		})
		.catch(function(err){
			$log.error(err);
		})
		.finally(function(){
			self.loading = false;
		});
	};
	
	this.changeTarget = function(){
/*		var nameSegments = self.relation.name.split('-');
		if(self.relation.target){
			nameSegments[1] = self.relation.target.label;	
		} else {
			nameSegments[1] = "[No target selected yet]";
		}
		self.relation.name = nameSegments.join('-');*/
		//TODO: implement in case we need some special formatting
		return (self.relation.target && self.relation.target.label) || '';
	};
    
    this.cancel = function() {
   		$scope.$dismiss();
    };

    this.ok = function($event) {
    	if(angular.element($event.target).hasClass('disabled')){
    		$event.stopPropagation();
    		return;
    	}
		sliderValueToRelation.apply(self, [self.slider.value, self.relation]);
		if(this.relation.target)
  			this.relation.targetEntityName = this.relation.target.name;
		if(isNewProperty){      	
		  this.relation.action = 'save';
		  selectedEntity['outbound-relations'].push(this.relation); 
		} else {
			if(this.relation.action!=='save')
				this.relation.action = 'update';
			selectedEntity['outbound-relations'] = selectedEntity['outbound-relations']
										.map(function(rel){
											if(rel.id === self.relation.id){
												return self.relation;
											}
											return rel;
										});
		}
		$scope.$close(selectedEntity);
    };
    
    function sliderValueToRelation(sliderValue, relation){
    	if(sliderValue === MULTIPLICITY_TYPES.ONE_TO_ONE){
      		relation.srcMultiplicity = MULTIPLICITY_OPTS.ONE;
      		relation.targetMultiplicity = MULTIPLICITY_OPTS.ONE;
  		} else if(sliderValue === MULTIPLICITY_TYPES.ONE_TO_MANY){
  			relation.srcMultiplicity = MULTIPLICITY_OPTS.MANY;
      		relation.targetMultiplicity = MULTIPLICITY_OPTS.ONE;
  		} else if(sliderValue === MULTIPLICITY_TYPES.MANY_TO_MANY){
  			relation.srcMultiplicity = MULTIPLICITY_OPTS.MANY;
      		relation.targetMultiplicity = MULTIPLICITY_OPTS.MANY;
  		}  else if(sliderValue === MULTIPLICITY_TYPES.MANY_TO_ONE){
  			relation.srcMultiplicity = MULTIPLICITY_OPTS.MANY;
      		relation.targetMultiplicity = MULTIPLICITY_OPTS.ONE;
  		}
    }
    
    function relationToSlider(relation, slider){
		if(relation.srcMultiplicity === MULTIPLICITY_OPTS.ONE && relation.targetMultiplicity === MULTIPLICITY_OPTS.ONE){
      		slider.value = MULTIPLICITY_TYPES.ONE_TO_ONE;
  		} else if(relation.srcMultiplicity === MULTIPLICITY_OPTS.MANY && relation.targetMultiplicity === MULTIPLICITY_OPTS.ONE){
  		 	slider.value = MULTIPLICITY_TYPES.ONE_TO_MANY;
  		} else if(relation.srcMultiplicity === MULTIPLICITY_OPTS.MANY && relation.targetMultiplicity === MULTIPLICITY_OPTS.MANY){
  			slider.value = MULTIPLICITY_TYPES.MANY_TO_MANY;
  		} else if(relation.srcMultiplicity === MULTIPLICITY_OPTS.MANY && relation.targetMultiplicity === MULTIPLICITY_OPTS.ONE){
  			slider.value = MULTIPLICITY_TYPES.MANY_TO_ONE;
  		}
    }    
    
    init.apply(this);
    
}]);
})(angular);
