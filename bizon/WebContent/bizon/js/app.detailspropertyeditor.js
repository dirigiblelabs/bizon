angular.module('businessObjects')
.controller('PropertyEditorCtrl', ['$scope', 'Item', '$stateParams', 'selectedEntity', function($scope, Item, $stateParams, selectedEntity) {
	
	var isNewProperty;
							
	this.typeOptions = [{
							id: '0',
							val: 'Text',
							variants:[{value: 1, legend: 'Small', typemap: "CHAR"},
								      {value: 2, legend: 'Normal', typemap: "VARCHAR"},
								      {value: 3, legend: 'Huge', typemap: "LONGVARCHAR"}]
						},{
							id: '1',
							val: 'Integer Number',
							variants:[{value:1, legend: 'Small', typemap: "SMALLINT"},
									  {value:2, legend: 'Normal', typemap: "INTEGER"},
									  {value:3, legend: 'Huge', typemap: "BIGINT"}]
						},{
							id: '2',
							val: 'Decimal Number',
							variants:[{value:1, legend: 'Small', typemap: "FLOAT"},
									  {value:2, legend: 'Normal', typemap: "REAL"},
									  {value:3, legend: 'Huge', typemap: "DOUBLE"}]
						},{
							id: '3',
							val: 'Alternative (Yes/No)',
							typemap: "tinyint"
						},{
							id: '4',
							val: 'Temporal',
							variants:[{value:1, legend: 'Date', typemap: "DATE"},
									  {value:2, legend: 'Time', typemap: "TIME"},
									  {value:3, legend: 'Date & Time', typemap: "TIMESTAMP"}]
						},{
							id: '5',
							val: 'Price',
							typemap: "FLOAT"
						},{
							id: '6',
							val: 'Email',
							typemap: "VARCHAR"
						},{
							id: '7',
							val: 'File',
							typemap: "BLOB"
						}];

	this.typeVariantsSlider = {
	  options: {
	  	showTicksValues: true,
	  	onEnd: onSlide,
	    stepsArray: []
	  }
	};	
	
	var self = this;
	
	this.typeSelectionChanged = function(){
		this.typeVariantsSlider.value = undefined;
		this.item.boi_type_name = this.selectedTypeOption.val;
		if(this.selectedTypeOption.variants){
			this.typeVariantsSlider.options.stepsArray = this.selectedTypeOption.variants;
			this.item.boi_type = this.selectedTypeOption.variants[0].typemap;
		} else {
			this.item.boi_type = this.selectedTypeOption.typemap;
		}
	};
	
	function init(){
		$scope.$$postDigest(function () {
			    $scope.$broadcast('rzSliderForceRender');
		});
		
		isNewProperty = $stateParams.item === undefined ? true : false;
		if(isNewProperty) {
			this.item = angular.copy(Item.newObjectTemplate);
			this.item.boi_boh_id = $stateParams.selectedEntity.boh_id;
		} else {
			this.item = $stateParams.item;
			this.selectedTypeOption = this.typeOptions.find(function(typeOption){
						return typeOption.val === self.item.boi_type_name;
					});
			if(this.selectedTypeOption.variants){
				this.typeVariantsSlider.options.stepsArray = this.selectedTypeOption.variants;
				this.selectedTypeOption.variant = this.selectedTypeOption.variants.find(function(variant){
						return variant.typemap === self.item.boi_type;
					});
				this.typeVariantsSlider.value = this.selectedTypeOption.variant.value;
			}
		}

    	/*$timeout(function () {
        	$scope.$broadcast('rzSliderForceRender');
    	});*/
	}
    
   this.cancel = function() {
      $scope.$dismiss($stateParams.selectedEntity);
    };

    this.ok = function() {
      if(isNewProperty){
      	this.item.action = 'save';
      	selectedEntity.properties.push(this.item);
      	$stateParams.entityForEdit = $stateParams.selectedEntity = selectedEntity;
      } else {
      	this.item.action = 'update';
      }
      $scope.$close($stateParams.entityForEdit);
    };
    
    init.apply(this);
    
    function onSlide(sliderId, modelValue){
    	self.selectedTypeOption.variant = self.selectedTypeOption.variants.find(function(variant){
	    		return variant.value === modelValue;
	    	});
    	self.item.boi_type = self.selectedTypeOption.variant.typemap;    	
    }
        
}]);
