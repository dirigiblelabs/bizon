	angular.module('businessObjects')
	.service('ResourceSvcConfiguration', function() {
	
		return {
			cfg: {
			    save: {
			        method: 'POST',
			        interceptor: {
		                response: function(res) {
		                	var location = res.headers('Location');
		                	if(location){
		                		var id = location.substring(location.lastIndexOf('/')+1);
		                		angular.extend(res.resource, { "boh_id": id });
	                		} else {
	                			console.error('Cannot infer id after save operation. HTTP Response Header "Location" is missing: ' + location);
	            			}
	                        return res.resource;
		                }
		            }, 
		            isArray: false
			    },
			    update: {
			        method: 'PUT'
			    }
		    }
		};
	})
	.service('Entity', ['$resource', 'ResourceSvcConfiguration', function($resource, ResourceSvcConfiguration) {
		var cfg = angular.copy(ResourceSvcConfiguration.cfg);
		cfg.count = {method:'GET', params:{count:true}, isArray:false};
	  	var res = $resource('../../js/bo_modeller/bo_header.js/:boId', { boId:'@id' }, cfg);
		
		res.newObjectTemplate = {
				"boh_name":"Business Object Name",
				"boh_table":"Tbl",
				"boh_description":"Description for business object",
			};
			
		return res;
	}])
	.service('Item', ['$resource', 'ResourceSvcConfiguration', function($resource, ResourceSvcConfiguration) {
	
	  	var res = $resource('../../js/bo_modeller/bo_item.js/:boId', { boId:'@id' }, ResourceSvcConfiguration.cfg);
		
		
		res.newObjectTemplate = {
					"boi_name":"Item",
					"boi_column":"Item",
					"boi_type": "String"			
				};
		return res;
	}])	
	.service('BuildService', ['$resource', function($resource) {
	  	return $resource('../../js/bo_modeller/bo_build_svc.js', {}, {
	  		build: {
	  			method: 'POST',
	  			isArray: false
  			}
	  	});
	}])	
	.service('masterDataSvc', ['Entity', 'Item',  '$q', function(Entity, Item, $q) {
	
		function createMasterDataTemplateObject(){
			var obj = angular.copy(Entity.newObjectTemplate);
			obj.properties = [];
			for(var i = 0; i < 3; i++){
				var item = angular.copy(Item.newObjectTemplate);
				item.boi_name += ' ' +i;
				item.boi_column += i;
				obj.properties.push(item);
			}
			return obj;
		}
		
		this.masterDataTemplateObject = createMasterDataTemplateObject();
		this.batchLoadedMasterData = [];//data cache
		this.querySettings;
		this.selection = [];
		
		var self = this;
		
		this.getLoadedData = function(){
			return this.batchLoadedMasterData;
		};
			
		/* make sure that sort and order properties of settings have not changed when paging and after the first page has been loaded. purge and start over again otehrwise */
		function query(settings){
			this.querySettings = settings;
			settings.expanded = (settings && settings.expanded!==undefined) || true;
			var deferred = $q.defer();
			Entity.query(settings).$promise
			.then(jQuery.proxy(function(data){
				if(self.querySettings.limit){
					if(!self.querySettings.offset)
						self.batchLoadedMasterData = data;//invalidate cached data
					else
						self.batchLoadedMasterData = [].concat(self.batchLoadedMasterData, data);//append next page of data
				} else {
					self.batchLoadedMasterData = data;//overwrite
				}
				deferred.resolve(data);
			}, this), function(error){
				deferred.resolve(error);
			});
			return deferred.promise;
		};
		
		function refresh(){
			this.batchLoadedMasterData = [];
			this.querySettings.offset = 0;
			return query.apply(this, [this.querySettings]).then(self.count);
		};
		
		/* 
			Looks up an object with the given id in the currently loaded data, and if instructed by the reloadDataOnDemand parameter, 
			will lookup remotely the data service and reload the list to feature this item too.
			Note: With progessive loading and pagination patterns it is possible that an item exists but has not been loaded from remote service yet.
				  The second parameter addresses precisely these situations.	
		*/
		this.get = function(id, lookupRemotelyOnDemand){
			var itemHit = this.batchLoadedMasterData.filter(function(item){
					if(item.boh_id == id ){
						return true;
					}
					return false;
				})[0];
			if(itemHit) {
				return $q.when(itemHit);
			} else if(lookupRemotelyOnDemand) {
				return Entity.get({boId:id}).$promise
				.then(function(item){
					if(item){
						return self.next.apply(self);
					}
					return;
				})
				.then(function(){
					return self.get.apply(self, [id, lookupRemotelyOnDemand]);
				})
				.catch(function(response){
					if(response.status===404){
						return;
					} else {
						throw repsonse.data.err;
					}
				});
			}
			return;
		};

		this._itemsCount;

		this.count = function(){
			return Entity.count().$promise
			.then(function(_data){
				self._itemsCount = _data.count;
				return self._itemsCount;
			});
		};
		
		this.hasMore = function() {
			return self.count()
			.then(function(){
				return self._itemsCount > 0 && self._itemsCount > self.batchLoadedMasterData.length;
			});
		};
		
		this.select = function(selection){
			self.selection = selection;
		};
		
		this.next = function(){
			return this.hasMore()
			.then(function(_hasMore){
				if(_hasMore){
					self.querySettings.offset = self.batchLoadedMasterData.length;
					return query.apply(self, [self.querySettings])
					.then(function(){
						return self.batchLoadedMasterData;
					});
				}
				return;
			});
		};
		
		this.prev = function(){
			//TODO: not implemented;
			throw Error('Not implemented');
		};

		this.create = function(cascaded, template){
			var reqParams = {};
			reqParams.cascaded = cascaded || true;
			return Entity.save(reqParams, template || this.masterDataTemplateObject).$promise
			.then(function(newItem){
				return refresh.apply(self)
				.then(function(){
					return newItem;
				});
			});
		};
		
		this.update = function(header){
			if(header.properties){
				var items = header.properties.filter(function(item){
					if(!item.action){
						return false;
					}
					return true;
				});
				var promises = items.map(function(item) {
					var action = item.action;
					delete item.action;
					if(action === 'remove') {
			        	return Item.remove({boId: item.boi_id}).$promise;
		        	} else {
		        		return Item[action]({boId: item.boi_id}, item).$promise;
	        		}
		    	});
			}

			promises.unshift(Entity.update({boId: header.boh_id}, header).$promise);
			promises.push(refresh.apply(self));
	    	return $q.all(promises);
		};	
		
		this.remove = function(headerId, cascaded){
			var reqParams = {};
			if(cascaded)
				reqParams.cascaded = cascaded;
			reqParams.boId = headerId;
			var deferred = $q.defer();
			Entity.remove(reqParams).$promise
			.then(function(){
					refresh.apply(self)
					.then(function(){
						deferred.resolve();
					}, function(refreshErr){
						deferred.reject(refreshErr);
					});
				},
				function(removeErr){
					deferred.reject(removeErr);
				});
			return deferred.promise;
		};
		
		this.serviceErrorMessageFormatter = function(message, errorPayload){
			if(errorPayload.data.err.code){
				message += ': [' + errorPayload.data.err.code + '] ';
			}
			if(errorPayload.data.err.message){
				message += ' ' + errorPayload.data.err.message;
			}
			return message;
		};
				
	}])  
