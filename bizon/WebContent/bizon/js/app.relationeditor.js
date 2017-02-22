(function(angular){
"use strict";

angular.module('businessObjects')
.controller('RelationEditorCtrl', ['$scope', 'masterDataSvc', '$log', 'selectedEntity', 'relation', function($scope, masterDataSvc, $log, selectedEntity, relation) {
	
	this.relation = relation;
	
	this.loading = false;
	this.noResults;
	var MULTIPLICITY_TYPES = Object.freeze({ONE_TO_ONE:1, ONE_TO_MANY:2, MANY_TO_MANY:3});	
	this.slider = {
	  options: {
	  	showTicksValues: true,
		floor: 1,
	    ceil: 3,
	    stepsArray: [
	      {value: MULTIPLICITY_TYPES.ONE_TO_ONE, legend: 'One-to-One'},
	      {value: MULTIPLICITY_TYPES.ONE_TO_MANY, legend: 'One-To-Many'},
	      {value: MULTIPLICITY_TYPES.MANY_TO_MANY, legend: 'Many-to-Many'}
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
	      {value: ASSOCIATION_TYPES.ASSOCIATION, legend: 'Associaiton'},
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
				boi_type: 'Relationship'
			};
			this.relation.bor_src_boh_name = selectedEntity.boh_name;
			this.relation.bor_src_type = MULTIPLICITY_OPTS.ONE;
			this.relation.bor_name = selectedEntity.boh_name +'- ';
		} else {
			if(this.relation.bor_target_boh_name){
				masterDataSvc.getByName(this.relation.bor_target_boh_name, true)
				.then(function(target){
					self.relation.target = target;
				});			
			}
			relationToSlider.apply(this, [this.relation, this.slider]);
		}
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
/*		var nameSegments = self.relation.bor_name.split('-');
		if(self.relation.target){
			nameSegments[1] = self.relation.target.boh_label;	
		} else {
			nameSegments[1] = "[No target selected yet]";
		}
		self.relation.bor_name = nameSegments.join('-');*/
		//TODO: implement in case we need some special formatting
		return (self.relation.target && self.relation.target.boh_label) || '';
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
  			this.relation.bor_target_boh_name = this.relation.target.boh_name;
		if(isNewProperty){      	
		  this.relation.action = 'save';
		  selectedEntity['outbound-relations'].push(this.relation); 
		} else {
			if(this.relation.action!=='save')
				this.relation.action = 'update';
			selectedEntity['outbound-relations'] = selectedEntity['outbound-relations']
										.map(function(rel){
											if(rel.bor_id === self.relation.bor_id){
												return self.relation;
											}
											return rel;
										});
		}
		$scope.$close(selectedEntity);
    };
    
    function sliderValueToRelation(sliderValue, relation){
    	if(sliderValue === MULTIPLICITY_TYPES.ONE_TO_ONE){
      		relation.bor_src_type = MULTIPLICITY_OPTS.ONE;
      		relation.bor_target_type = MULTIPLICITY_OPTS.ONE;
  		} else if(sliderValue === MULTIPLICITY_TYPES.ONE_TO_MANY){
  			relation.bor_src_type = MULTIPLICITY_OPTS.MANY;
      		relation.bor_target_type = MULTIPLICITY_OPTS.ONE;
  		} else if(sliderValue === MULTIPLICITY_TYPES.MANY_TO_MANY){
  			relation.bor_src_type = MULTIPLICITY_OPTS.MANY;
      		relation.bor_target_type = MULTIPLICITY_OPTS.MANY;
  		}
    }
    
    function relationToSlider(relation, slider){
		if(relation.bor_src_type === MULTIPLICITY_OPTS.ONE && relation.bor_target_type === MULTIPLICITY_OPTS.ONE){
      		slider.value = MULTIPLICITY_TYPES.ONE_TO_ONE;
  		} else if(relation.bor_src_type === MULTIPLICITY_OPTS.MANY && relation.bor_target_type === MULTIPLICITY_OPTS.ONE){
  		 	slider.value = MULTIPLICITY_TYPES.ONE_TO_MANY;
  		} else if(relation.bor_src_type === MULTIPLICITY_OPTS.MANY && relation.bor_target_type === MULTIPLICITY_OPTS.MANY){
  			slider.value = MULTIPLICITY_TYPES.MANY_TO_MANY;
  		}			
    }    
    
    init.apply(this);
    
}]);
})(angular);
