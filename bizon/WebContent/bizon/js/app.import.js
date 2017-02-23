(function(angular){
"use strict";

angular.module('businessObjects')
.controller('ImportCtrl', ['$scope', '$log', 'FileUploader', function($scope, $log, FileUploader) {
	
/*	this.importData = function(){
		$log.info('imorting data');
		var f = $('input[type="file"]')[0].files[0],
		    r = new FileReader();
		r.onloadend = function(e){
		    var data = e.target.result;
		    masterDataSvc.importData(data);
		};
		r.readAsBinaryString(f);		
	};
*/	
	
	this.close = function(){
		$scope.$close();
	};

    var uploader = this.uploader = new FileUploader({
        url: '../../js/bizon/svc/v1/entities.js'
    });

    // UPLOADER FILTERS

/*    uploader.filters.push({
        name: 'customFilter',
        fn: function(item {File|FileLikeObject}, options) {
            return this.queue.length < 5;
        }
    });*/

    // UPLOADER CALLBACKS

    uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
//        console.info('onWhenAddingFileFailed', item, filter, options);
    };
    uploader.onAfterAddingFile = function(fileItem) {
//        console.info('onAfterAddingFile', item);    
    };
    uploader.onAfterAddingAll = function(addedFileItems) {
//        console.info('onAfterAddingAll', addedFileItems);
    };
    uploader.onBeforeUploadItem = function(item) {
//        console.info('onBeforeUploadItem', item);
    };
    uploader.onProgressItem = function(fileItem, progress) {
//        console.info('onProgressItem', fileItem, progress);
    };
    uploader.onProgressAll = function(progress) {
//        console.info('onProgressAll', progress);
    };
    uploader.onSuccessItem = function(fileItem, response, status, headers) {
//        console.info('onSuccessItem', fileItem, response, status, headers);
    };
    uploader.onErrorItem = function(fileItem, response, status, headers) {
//        console.info('onErrorItem', fileItem, response, status, headers);
    };
    uploader.onCancelItem = function(fileItem, response, status, headers) {
//        console.info('onCancelItem', fileItem, response, status, headers);
    };
    uploader.onCompleteItem = function(fileItem, response, status, headers) {
//        console.info('onCompleteItem', fileItem, response, status, headers);
    };
    uploader.onCompleteAll = function() {
//        console.info('onCompleteAll');
    };

//    console.info('uploader', uploader);
	
}]);
})(angular);
