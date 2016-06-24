angular.module('businessObjects', ['ngAnimate', 'ui.bootstrap'])
.constant('CFG', {
	serviceUrl: "chrome://"
})
.service('ItemsModel', function ($http, CFG, $q) {
	var service = this,
	path = 'items/';
	function getUrl() {
		return CFG.serviceUrl + path;
	}
	function getUrlForId(itemId) {
		return getUrl(path) + itemId;
	}
	service.getAll = function () {
		var deferred = $q.defer();
		var mockContent = [{
			"id":"1",
			"name":"A",
			"description":"Short description for entity A",
			"key":"Id",
			"table":"TBL_A"
		},
		{
			"id":"2",
			"name":"B",
			"description":"Short description for entity B",
			"key":"Id",
			"table":"TBL_B"
		},
		{
			"id":"3",
			"name":"C",
			"description":"Short description for entity C",
			"key":"Id",
			"table":"TBL_C"
		}]
		$http.get(getUrl())
			.success(function(response){
				deferred.resolve(mockContent)
			})
			.error(function(msg, code){
				deferred.resolve(mockContent);
			});
		return deferred.promise;//$http.get(getUrl());
	};
	
	service.getItemDetails = function (itemId) {
		var deferred = $q.defer();
		var mockContent = [{
			"id":"p1",
			"name":"Property 1",
			"type":"Integer"
		},
		{
			"id":"p2",
			"name":"Property 2",
			"type":"Boolean"
		},
		{
			"id":"p3",
			"name":"Property 3",
			"type":"String"
		}];
		$http.get(getUrl())
			.success(function(response){
				deferred.resolve(mockContent);
			})
			.error(function(msg, code){
				deferred.resolve(mockContent);
			});
		return deferred.promise;//$http.get(getUrl());
	};
	
	service.create = function (item) {
		return $http.post(getUrl(), item);
	};
	service.update = function (itemId, item) {
		return $http.put(getUrlForId(itemId), item);
    };
	service.destroy = function (itemId) {
	    return $http.delete(getUrlForId(itemId));
	};

})
.controller('MainCtrl', ['ItemsModel', '$scope', function (ItemsModel, $scope) {

	$scope.errorMessage = null;
	$scope.items = [];
	
	
	$scope.getItems = function getItems() {
		ItemsModel.getAll()
    	.then(function (result) {
    		$scope.items = result;
    	});
	}
		
	$scope.getItems.apply(this);
	
	$scope.selectedItem;
	$scope.selectedItemDetails;
	
	$scope.toggleItemSelection = function(item){
		if($scope.selectedItem)
			$scope.selectedItem._selectionActive = undefined;
		if(!item || item === $scope.selectedItem){
			$scope.selectedItem = undefined;
		} else {
			$scope.selectedItem = item;
			$scope.selectedItem._selectionActive = 'active';
			showDetails($scope.selectedItem);
		}
	}
	
	function showDetails (item){
		ItemsModel.getItemDetails(item.id)
			.then(function (result) {
				$scope.selectedItemDetails = result;
			  });
	}
	
	function createItem(item) {
		ItemsModel.create(item)
	      .then(function (result) {
	        initCreateForm();
	        getItems();
		  });
	}
	
	function initCreateForm() {
	    $scope.newItem = { name: '', description: '' };
	}

	$scope.createItem = createItem;
	initCreateForm();
	
	function setEditedItem(item) {
	    $scope.editedItem = angular.copy(item);
	    $scope.isEditing = true;
	}
	
	function updateItem(item) {
	    ItemsModel.update(item.id, item)
	      .then(function (result) {
	        cancelEditing();
	        getItems();
	      });
	  }

	function cancelEditing() {
	    $scope.editedItem = null;
	    $scope.isEditing = false;
	}
	
	function isCurrentItem(itemId) {
		return $scope.editedItem !== null && $scope.editedItem.id === itemId;
	}

	$scope.editedItem = null;
	$scope.isEditing = false;
	$scope.updateItem = updateItem;
	$scope.setEditedItem = setEditedItem;
	$scope.cancelEditing = cancelEditing;
	
	$scope.isCurrentItem = isCurrentItem;
	
	function deleteItem(itemId) {
	    ItemsModel.destroy(itemId)
	      .then(function (result) {
	        cancelEditing();
	        getItems();
	      });
	}

	$scope.deleteItem = deleteItem;
	
}]);
