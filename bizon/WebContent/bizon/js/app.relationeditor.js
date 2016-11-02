angular.module('businessObjects')
.controller('RelationEditorCtrl', ['$scope', 'masterDataSvc', '$log', '$stateParams', 'selectedEntity', 'relation', '$timeout', function($scope, masterDataSvc, $log, $stateParams, selectedEntity, relation, $timeout) {
	
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
	var isNewProperty = (relation === undefined ? true : false);
	
	var self = this;
	
	//TODO:move to directive	
	this.registerForValidation = function () {
		//$timeout without delay will wait for the view tempalte to load
		$timeout(function(){
			self.form = angular.element('.modal-dialog form');		
			self.formValidationOptions = {
				errorClass: 'has-error',
		     	validClass : 'has-success',
		     	ignore: 'input[style*="position: absolute"]',
		 		highlight: function (element, errorClass, validClass) {
					            angular.element(element).closest('.form-group').removeClass('has-success').addClass('has-error');
					            if($validator.numberOfInvalids()>0)
					            	angular.element('.modal-footer .btn.btn-success').addClass('disabled');
					        },
				unhighlight: function(element, errorClass, validClass) {
					        	$(element).closest('.form-group').removeClass('has-error').addClass('has-success');
					        	if($validator.numberOfInvalids()<1)
						        	angular.element('.modal-footer .btn.btn-success').removeClass('disabled');
					        },
				success: "has-success"	    
			};			
			var $validator = angular.element(self.form).validate(self.formValidationOptions);
//			validator.form();//This doesn't work as expected
			$('.modal-dialog form .form-control[required]').each(function(i){
        		$validator.element(this);
        	})
		});
	};
			
	function init(){
		if(isNewProperty) {
			this.relation = {
				boi_type: 'Relationship'
			};
			this.relation.bor_src_id = selectedEntity.boh_id;
			this.relation.bor_src_type = MULTIPLICITY_OPTS.ONE;
			this.relation.bor_name = selectedEntity.boh_name +'- ';
		} else {
//			this.relation = $stateParams.item;
			if(this.relation.bor_target_id){
				masterDataSvc.get(this.relation.bor_target_id, true)
				.then(function(target){
					self.relation.target = target;
				});			
			}
			relationToSlider.apply(this, [this.relation, this.slider]);
		}
		$scope.$$postDigest(function () {
			    $scope.$broadcast('rzSliderForceRender');
		});	
		this.registerForValidation();
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
			nameSegments[1] = self.relation.target.boh_name;	
		} else {
			nameSegments[1] = "[No target selected yet]";
		}
		self.relation.bor_name = nameSegments.join('-');*/
		//TODO: implement in case we need some special formatting
		return (self.relation.target && self.relation.target.boh_name) || '';
	};
    
    this.cancel = function() {
   		$scope.$dismiss($stateParams.selectedEntity);
    };

    this.ok = function($event) {
    	if(angular.element($event.target).hasClass('disabled')){
    		$event.stopPropagation();
    		return;
    	}
		sliderValueToRelation.apply(self, [self.slider.value, self.relation]);
		if(this.relation.target)
  			this.relation.bor_target_id = this.relation.target.boh_id;
		if(isNewProperty){      	
		  this.relation.action = 'save';
		  selectedEntity.properties.push(this.relation);
		} else {
			this.relation.action = 'update';
			selectedEntity.properties = selectedEntity.properties
				.map(function(prop){
					if(prop.bor_id === self.relation.bor_id){
						return self.relation;
					}
					return prop;
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
