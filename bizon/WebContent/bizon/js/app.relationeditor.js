angular.module('businessObjects')
.controller('RelationEditorCtrl', ['$scope', 'masterDataSvc', '$stateParams', 'selectedEntity', function($scope, masterDataSvc, $stateParams, selectedEntity) {
	
	this.loading = false;
	this.noResults;
	this.slider = {
	  options: {
	  	showTicksValues: true,
		floor: 1,
	    ceil: 3,
	    stepsArray: [
	      {value: 1, legend: 'One-to-One'},
	      {value: 2, legend: 'One-To-Many'},
	      {value: 3, legend: 'Many-to-Many'}
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
			this.relation.name = selectedEntity.boh_name +'- ';
		} else {
			this.relation = $stateParams.item
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
			consle.error(err);
		})
		.finally(function(){
			self.loading = false;
		});
	};
	
	this.changeTarget = function(){
		var nameSegments = self.relation.name.split('-');
		if(self.relation.target){
			nameSegments[1] = self.relation.target.boh_name;	
		} else {
			nameSegments[1] = "[No target selected yet]"
		}
		self.relation.name = nameSegments.join('-');
		return (self.relation.target && self.relation.target.boh_name) || '';
	};
    
   this.cancel = function() {
      $scope.$dismiss($stateParams.selectedEntity);
    };

    this.ok = function() {    
		if(self.slider.value === 1){
      		this.relation.bor_src_type = MULTIPLICITY_OPTS.ONE;
      		this.relation.bor_target_type = MULTIPLICITY_OPTS.ONE;
  		} else if(self.slider.value === 2){
  			this.relation.bor_src_type = MULTIPLICITY_OPTS.MANY;
      		this.relation.bor_target_type = MULTIPLICITY_OPTS.ONE;
  		} else if(self.slider.value === 3){
  			this.relation.bor_src_type = MULTIPLICITY_OPTS.MANY;
      		this.relation.bor_target_type = MULTIPLICITY_OPTS.MANY;
  		}
  		this.relation.bor_target_id = this.relation.target.boh_id;
      if(isNewProperty){      	
      	this.relation.action = 'save';
      	selectedEntity.properties.push(this.relation);
      	$stateParams.entityForEdit = $stateParams.selectedEntity = selectedEntity;
      } else {
      	this.item.action = 'update';
    	selectedEntity = $stateParams.entityForEdit = $stateParams.selectedEntity; 
      }
      $scope.$close(selectedEntity);
    };
    
    init.apply(this);
    
}]);
