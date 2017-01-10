(function(angular){
"use strict";

	angular.module('businessObjects')
	.service('ResourceSvcConfiguration', ['$log', function($log) {
	
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
	                			$log.error('Cannot infer id after save operation. HTTP Response Header "Location" is missing: ' + location);
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
	}])
	.service('Entity', ['$resource', 'ResourceSvcConfiguration', function($resource, ResourceSvcConfiguration) {
		var cfg = angular.copy(ResourceSvcConfiguration.cfg);
/*		cfg.count = {method:'GET', params:{count:true}, isArray:false, ignoreLoadingBar: true};*/
		cfg.getByName = {method:'GET', isArray:false, ignoreLoadingBar: false};
		
	  	var res = $resource('../../js/bizon/svc/v1/header.js/:boId', { boId:'@id' }, cfg);

		res.newObjectTemplate = {
				"boh_name":"BizEntity",
				"boh_label":"Business Object Name",
				"boh_description":"Description for business object",
				"boh_ds_gen_enabled": true,
				"boh_svc_gen_enabled": true,
				"boh_ui_gen_enabled": true
			};
			
		return res;
	}])
	.service('EntityCount', ['$resource', function($resource) {
	  	return $resource('../../js/bizon/svc/v1/header.js/count', {}, 
	  			{get: {method:'GET', params:{}, isArray:false, ignoreLoadingBar: true}});
	}])	
	.service('EntityQueryByName', ['$resource', function($resource) {
	  	return $resource('../../js/bizon/svc/v1/header.js', {}, {
	  		queryByName: {
	  			method:'GET', 
	  			isArray:true, 
	  			ignoreLoadingBar: true
  			}
	  	});
	}])	
	.service('Item', ['$resource', 'ResourceSvcConfiguration', function($resource, ResourceSvcConfiguration) {
	
	  	var res = $resource('../../js/bizon/svc/v1/item.js/:boId', { boId:'@id' }, ResourceSvcConfiguration.cfg);
		
		res.newObjectTemplate = {
					"boi_name":"Item",
					"boi_column":"Item",
					"boi_type_name": "Text",					
					"boi_type": "VARCHAR",
					"length": "100",					
					"boi_null": true,
				};
		return res;
	}])	
	.service('BuildService', ['$resource', function($resource) {
	  	return $resource('../../js/generator/service.js/:path', {}, {
	  		build: {
	  			method: 'POST',
	  			isArray: false
  			},
  			listTemplates: {
	  			method: 'GET',
	  			params: {path: 'templates'},
	  			isArray: false
  			}
	  	});
	}])	
	.service('Relation', ['$resource', 'ResourceSvcConfiguration', function($resource, ResourceSvcConfiguration) {
	  	return $resource('../../js/bizon/svc/v1/relation.js/:boId', { boId:'@id' }, ResourceSvcConfiguration.cfg);
	}])		
	.service('masterDataSvc', ['Entity', 'Item', 'Relation', 'EntityCount', 'EntityQueryByName', '$q', '$log', function(Entity, Item, Relation, EntityCount, EntityQueryByName, $q, $log) {

		var createRandomAlphanumeric = function(length){
			if(!length)
				length = 4;
			var power = length;
			var sliceIndex = -Math.abs(length);
		    return ("0000" + (Math.random()*Math.pow(36,power) << 0).toString(36)).slice(sliceIndex);
		}
	
		function createMasterDataTemplateObject(){
			var obj = angular.copy(Entity.newObjectTemplate);
			obj.properties = [];
			for(var i = 0; i < 3; i++){
				var item = angular.copy(Item.newObjectTemplate);
				item.boi_name += ' ' +i;
				item.boi_column += i;
				item.boi_boh_name = obj.boh_name;
				obj.properties.push(item);
			}
			obj.properties[0].boi_null = false;			
			return obj;
		}
		
		this.masterDataTemplateObject = createMasterDataTemplateObject();
		this.batchLoadedMasterData = [];//data cache
		this.querySettings = {
			limit: 100,
			sort: 'boh_label',
			order: 'ASC'
		};
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
			.then(function(data){
				if(data)
					data = data.map(function(entity){
						if(entity.properties){
							entity.properties = entity.properties.map(function(item){
								if(!item.boi_type)
									item.boi_type = 'Relationship';
								return item;
							});
						}
						return entity;
					});
				if(self.querySettings.limit){
					if(!self.querySettings.offset)
						self.batchLoadedMasterData = data;//invalidate cached data
					else
						self.batchLoadedMasterData = [].concat(self.batchLoadedMasterData, data);//append next page of data
				} else {
					self.batchLoadedMasterData = data;//overwrite
				}
				deferred.resolve(data);
			})
			.catch(function(error){
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
						throw response.data.err;
					}
				});
			}
			return;
		};
		
		this.getByName = function(name, lookupRemotelyOnDemand){
			var itemHit = this.batchLoadedMasterData.filter(function(item){
					if(item.boh_name == name ){
						return true;
					}
					return false;
				})[0];
			if(itemHit) {
				return $q.when(itemHit);
			} else if(lookupRemotelyOnDemand) {
				return Entity.getByName({getByName:name}).$promise
				.then(function(item){
					if(item){
						return self.next.apply(self);
					}
					return;
				})
				.then(function(){
					return self.get.apply(self, [name, lookupRemotelyOnDemand]);
				})
				.catch(function(response){
					if(response.status===404){
						return;
					} else {
						throw response.data.err;
					}
				});
			}
			return;
		};		
		
		/* 
			Looks up an object with the given id in the currently loaded data, and if instructed by the reloadDataOnDemand parameter, 
			will lookup remotely the data service and reload the list to feature this item too.
			Note: With progessive loading and pagination patterns it is possible that an item exists but has not been loaded from remote service yet.
				  The second parameter addresses precisely these situations.	
		*/
		this.findByName = function(name){
			return EntityQueryByName.queryByName({name:name}).$promise;
		};		

		this._itemsCount;

		this.count = function(){
			return EntityCount.get().$promise
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
			var entity = template;
			if(!entity){
				entity = this.masterDataTemplateObject = createMasterDataTemplateObject();
				entity.boh_name += createRandomAlphanumeric();
				entity.properties.map(function(prop){
					prop.boi_boh_name = entity.boh_name;
					return prop;
				});
			}
			return Entity.save(reqParams, entity).$promise
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
						if(item.boi_type !== 'Relationship')
			        		return Item.remove({boId: item.boi_id}).$promise;
			        	else
			        		return Relation.remove({boId: item.bor_id}).$promise;			        	
		        	} else {
		        		if(item.boi_type !== 'Relationship')
		        			return Item[action]({boId: item.boi_id}, item).$promise;
		        		else
		        			return Relation[action]({boId: item.boi_id}, item).$promise;		        		
	        		}
		    	});
			}

			promises.unshift(Entity.update({boId: header.boh_id}, header).$promise);
			//promises.push(refresh.apply(self));
	    	return $q.all(promises).then(function(){
	    		refresh.apply(self);
	    	});
		};	
		
		this.remove = function(headerId, cascaded){
			var reqParams = {};
			if(cascaded)
				reqParams.cascaded = cascaded;
			if(headerId !== undefined){
				if(headerId.constructor === Array){
					reqParams = headerId;
				} else {
					reqParams.boId = headerId;
				}
			}
			var deferred = $q.defer();
			Entity.remove(reqParams).$promise
			.then(function(){
					refresh.apply(self)
					.then(function(){
						deferred.resolve();
					})
					.catch(function(refreshErr){
						deferred.reject(refreshErr);
					});
				})
			.catch(function(removeErr){
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
		
		this.exportData = function(){
			$log.info('Exporting data');
			return Entity.query({expanded:true}).$promise;
		};
		
		this.importData = function(data){
			$log.info('Data imported');
		};
				
	}]);
})(angular);
