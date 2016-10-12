angular.module('businessObjects')
.controller('PropertyEditorCtrl', ['$scope', 'Item', '$stateParams', 'selectedEntity', function($scope, Item, $stateParams, selectedEntity) {
	
	var isNewProperty;
	
	this.typeOptions = [{
							id: '1',
							val: 'Integer'
						},{
							id: '2',
							val: 'String'
						},{
							id: '3',
							val: 'Boolean'
						}];
	
	var self = this;
	
	this.typeSelectionChanged = function(){
		this.item.boi_type = this.selectedTypeOption.val;
	};
	
	function init(){
		isNewProperty = $stateParams.item === undefined ? true : false;
		if(isNewProperty) {
			this.item = angular.copy(Item.newObjectTemplate);
			this.item.boi_boh_id = $stateParams.selectedEntity.boh_id;
		} else {
			this.item = $stateParams.item;
		}
		this.selectedTypeOption = {
			id: this.typeOptions.find(function(el){
					return el.val === self.item.boi_type;
				}).id,
			val: this.typeOptions.find(function(el){
					return el.val === self.item.boi_type;
				 }).val,
		};		
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
    	selectedEntity = $stateParams.entityForEdit = $stateParams.selectedEntity; 
      }
      $scope.$close(selectedEntity);
    };
    
    init.apply(this);
    
}]);
