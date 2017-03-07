(function(angular){
"use strict";

angular.module('businessObjects')
.controller('PropertyEditorCtrl', ['Settings', '$scope', 'Item', 'selectedEntity', 'item', function(Settings, $scope, Item, selectedEntity, item) {
	
	this.app = Settings;
	this.item = item;
	var isNewProperty = item === undefined ? true : false;
							
	this.typeOptions = [{
							id: '0',
							val: 'Text',
							variants:[{value: 1, legend: 'Small', typemap: "VARCHAR", size: 40},
								      {value: 2, legend: 'Normal', typemap: "VARCHAR", size: 255},
								      {value: 3, legend: 'Huge', typemap: "VARCHAR", size: 10000}]
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
							typemap: "SMALLINT"
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
		this.item.typeLabel = this.selectedTypeOption.val;
		if(this.selectedTypeOption.variants){
			this.typeVariantsSlider.options.stepsArray = this.selectedTypeOption.variants;
			this.item.type = this.selectedTypeOption.variants[0].typemap;
			if(this.selectedTypeOption.variants[0].size !== undefined)
				this.item.size = this.selectedTypeOption.variants[0].size;
			else
				this.item.size = 0;
		} else {
			this.item.type = this.selectedTypeOption.typemap;
		}
	};

	function init(){
		$scope.$$postDigest(function() {
			    $scope.$broadcast('rzSliderForceRender');
			});
		if(isNewProperty) {
			this.item = angular.copy(Item.newObjectTemplate);
			this.item.entityName = selectedEntity.name;
			if(selectedEntity.properties){
				var orders = selectedEntity.properties.map(function (property) {
			    	return property.order || 0;
			  	});
			    var maxOrder = Math.max.apply(Math, orders);
			    this.item.order = maxOrder+1;
			}
		}
		this.selectedTypeOption = this.typeOptions.find(function(typeOption){
					return typeOption.val === self.item.typeLabel;
				});
		if(this.selectedTypeOption.variants){
			this.typeVariantsSlider.options.stepsArray = this.selectedTypeOption.variants;
			this.selectedTypeOption.variant = this.selectedTypeOption.variants.find(function(variant){
					var typeMatch = variant.typemap === self.item.type;
					var sizeMatch = variant.size!==undefined?(variant.size>=self.item.size):true;
					return typeMatch && sizeMatch;
				});
			this.typeVariantsSlider.value = this.selectedTypeOption.variant.value;
		}
	}
    
   this.cancel = function() {
      $scope.$dismiss();
    };

    this.ok = function() {
	  this.item.name = this.item.label.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
	  this.item.column = this.item.label.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
	  if(this.item.column.length>255)
		this.item.column = this.item.column.substring(0, 255);
      if(isNewProperty){
      	this.item.action = 'save';
      	selectedEntity.properties.push(this.item);
      } else {
      	this.item.action = 'update';
      	selectedEntity.properties = selectedEntity.properties.map(function(prop){
      		if(prop.id === self.item.id){
      			return self.item;
      		}
      		return prop;
      	});
      }
      $scope.$close(selectedEntity);
    };
    
    init.apply(this);
    
    function onSlide(sliderId, modelValue){
    	self.selectedTypeOption.variant = self.selectedTypeOption.variants.find(function(variant){
	    		return variant.value === modelValue;
	    	});
    	self.item.type = self.selectedTypeOption.variant.typemap;
		if(self.selectedTypeOption.variant.size !== undefined)
			self.item.size = self.selectedTypeOption.variant.size;
		else
			self.item.size = 0;
    }
        
}]);
})(angular);
