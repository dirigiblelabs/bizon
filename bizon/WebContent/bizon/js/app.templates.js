(function(angular){
"use strict";

angular.module('businessObjects')
.controller('TemplatesCtrl', ['$log','$stateParams', function($log, $stateParams) {

	var json = [{
		"tmplId": "proc",
		"label": "Procurement",
		"icon": "fa fa-shopping-cart",
		"templates": [{
			"name":"Template 1"
		},{
			"name":"Template 2"
		}]
	},{
		"tmplId": "trvl",
		"label": "Travel & Expense",
		"icon": "fa fa-plane"
	},{
		"tmplId": "crm",
		"label": "CRM"
	},{
		"tmplId": "ecmrc",
		"label": "eCommerce"
	},{
		"tmplId": "vndr",
		"label": "Vendor Management"
	}];
	
	this.items = json;
	
	this.tmplFamily = $stateParams.tmplFamily;
	var self  = this;
	
	this.selected = this.tmplFamily && this.items && this.items.find(function(item){
			return item.tmplId === self.tmplFamily;
		});
			
}]);
})(angular);
