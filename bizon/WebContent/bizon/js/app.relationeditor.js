angular.module('businessObjects')
.controller('RelationEditorCtrl', ['$scope', 'masterDataSvc', '$log', '$stateParams', 'selectedEntity', function($scope, masterDataSvc, $log, $stateParams, selectedEntity) {
	
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
	var isNewProperty;
	var self = this;
		
	function init(){
		isNewProperty = $stateParams.item === undefined ? true : false;
		if(isNewProperty) {
			this.relation = {
				boi_type: 'Relationship'
			};
			this.relation.bor_src_id = $stateParams.selectedEntity.boh_id;
			this.relation.bor_src_type = MULTIPLICITY_OPTS.ONE;
			this.relation.bor_name = selectedEntity.boh_name +'- ';
		} else {
			this.relation = $stateParams.item;
		}
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
		var nameSegments = self.relation.bor_name.split('-');
		if(self.relation.target){
			nameSegments[1] = self.relation.target.boh_name;	
		} else {
			nameSegments[1] = "[No target selected yet]";
		}
		self.relation.bor_name = nameSegments.join('-');
		return (self.relation.target && self.relation.target.boh_name) || '';
	};
    
   this.cancel = function() {
      $scope.$dismiss($stateParams.selectedEntity);
    };

    this.ok = function() {    
		if(self.slider.value === MULTIPLICITY_TYPES.ONE_TO_ONE){
      		this.relation.bor_src_type = MULTIPLICITY_OPTS.ONE;
      		this.relation.bor_target_type = MULTIPLICITY_OPTS.ONE;
  		} else if(self.slider.value === MULTIPLICITY_TYPES.ONE_TO_MANY){
  			this.relation.bor_src_type = MULTIPLICITY_OPTS.MANY;
      		this.relation.bor_target_type = MULTIPLICITY_OPTS.ONE;
  		} else if(self.slider.value === MULTIPLICITY_TYPES.MANY_TO_MANY){
  			this.relation.bor_src_type = MULTIPLICITY_OPTS.MANY;
      		this.relation.bor_target_type = MULTIPLICITY_OPTS.MANY;
  		}
  		this.relation.bor_target_id = this.relation.target.boh_id;
  		this.relation.bor_type = this.relTypeSlider.value;
      if(isNewProperty){      	
      	this.relation.action = 'save';
      	selectedEntity.properties.push(this.relation);
      	$stateParams.entityForEdit = $stateParams.selectedEntity = selectedEntity;
      } else {
      	this.relation.action = 'update';
    	selectedEntity = $stateParams.entityForEdit = $stateParams.selectedEntity; 
      }
      $scope.$close(selectedEntity);
    };
    
    init.apply(this);
    
}]);
