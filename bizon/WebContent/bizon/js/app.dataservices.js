(function(angular){
"use strict";

	angular.module('businessObjects')
	.service('Utils', [function(){
		var toAlphanumeric= function(string){
			return string.replace(/[^A-Za-z0-9_]/g, '');
		};
		var createRandomAlphanumeric = function(length){
			if(!length)
				length = 4;
			var power = length;
			var sliceIndex = -Math.abs(length);
		    return ("0000" + (Math.random()*Math.pow(36,power) << 0).toString(36)).slice(sliceIndex);
		};
		return {
			transformToAlphanumeric : toAlphanumeric,
			randomAlphanumeric: createRandomAlphanumeric
		};
	}])		
	.service('ResourceSvcConfiguration', ['$log', function($log) {
	
		return {
			cfg: {
			    query : {
					method: 'GET',
			        interceptor: {
						response: function(res) {
		                	var _count= res.headers('X-dservice-list-count');
		                	if(_count!==undefined){
		                		_count = parseInt(_count, 10);
		                		res.resource.$count = _count;
	                		}
	                        return res.resource;
		                }
		            }, 
		            isArray: true
			    },
			    save: {
			        method: 'POST',
			        interceptor: {
		                response: function(res) {
		                	var location = res.headers('Location');
		                	if(location){
		                		var id = location.substring(location.lastIndexOf('/')+1);
		                		angular.extend(res.resource, { "id": id });
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
		cfg.queryByProperty = {method:'GET', isArray:true, ignoreLoadingBar: true};
		
	  	var res = $resource('../../js/bizon/svc/v1/entities.js/:boId', { boId:'@id' }, cfg);

		res.newObjectTemplate = {
				"label":"Business Object Name",
				"description":"Description for business object",
				"dsGenEnabled": true,
				"svcGenEnabled": true,
				"uiGenEnabled": true
			};
			
		return res;
	}])
	.service('EntityCount', ['$resource', function($resource) {
	  	return $resource('../../js/bizon/svc/v1/entities.js/count', {}, 
	  			{get: {method:'GET', params:{}, isArray:false, ignoreLoadingBar: true}});
	}])	
	.service('EntityQueryByName', ['$resource', function($resource) {
	  	return $resource('../../js/bizon/svc/v1/entities.js', {}, {
	  		queryByName: {
	  			method:'GET', 
	  			isArray:true, 
	  			ignoreLoadingBar: true
  			}
	  	});
	}])	
	.service('Item', ['$resource', 'ResourceSvcConfiguration', function($resource, ResourceSvcConfiguration) {
	
	  	var res = $resource('../../js/bizon/svc/v1/properties.js/:boId', { boId:'@id' }, ResourceSvcConfiguration.cfg);
		
		res.newObjectTemplate = {
					"name":"item",
					"label":"Item",
					"column":"Item",
					"typeLabel": "Text",					
					"type": "VARCHAR",
					"size": 40,
					"required": true,
				};
		return res;
	}])
	.service('BuildTemplatesService', ['$resource', function($resource) {
	  	return $resource('../../js/bizon/svc/v1/build/templates.js', {}, {
  			listTemplates: {
	  			method: 'GET',
	  			isArray: false
  			}
	  	});
	}])
	.service('BuildService', ['$resource', function($resource) {
	  	return $resource('../../js/bizon/svc/v1/build/service.js', {}, {
	  		build: {
	  			method: 'POST',
	  			isArray: false
  			}
	  	});
	}])
	.service('PublishService', ['$resource', function($resource) {
	  	return $resource('../../js-secured/registry/api/develop/publish.js', {}, {
	  		publish: {
	  			method: 'POST',
	  			isArray: false
  			}
	  	});
	}])	
	.service('Relation', ['$resource', 'ResourceSvcConfiguration', function($resource, ResourceSvcConfiguration) {
	  	return $resource('../../js/bizon/svc/v1/relations.js/:boId', { boId:'@id' }, ResourceSvcConfiguration.cfg);
	}])		
	.service('masterDataSvc', ['Entity', 'Item', 'Relation', 'EntityCount', 'EntityQueryByName', '$q', '$log', 'Utils', function(Entity, Item, Relation, EntityCount, EntityQueryByName, $q, $log, Utils) {

		/*var createRandomAlphanumeric = function(length){
			if(!length)
				length = 4;
			var power = length;
			var sliceIndex = -Math.abs(length);
		    return ("0000" + (Math.random()*Math.pow(36,power) << 0).toString(36)).slice(sliceIndex);
		};*/
	
		function createMasterDataTemplateObject(){
			var obj = angular.copy(Entity.newObjectTemplate);
			obj.properties = [];
			for(var i = 0; i < 3; i++){
				var item = angular.copy(Item.newObjectTemplate);
				item.name += i;
				item.label += ' '+i;
				item.column += i;
				item.order = i+1;
				item.entityName = obj.name;
				obj.properties.push(item);
			}
			obj.properties[0].required = false;			
			return obj;
		}
		
		this.masterDataTemplateObject = createMasterDataTemplateObject();
		this.data = {};
		this.data['items'] = this.batchLoadedMasterData = [];//data cache
		this['$count'] = {
			val: 0
		};
		this.querySettings = {
			$limit: 100,
			$sort: 'label',
			$order: 'asc'
		};
		this.selection = [];
		
		var self = this;
		
		this.getLoadedData = function(){
			return this.batchLoadedMasterData;
		};
			
		/* make sure that sort and order properties of settings have not changed when paging and after the first page has been loaded. purge and start over again otehrwise */
		function query(settings){
			this.querySettings = settings;
			if(settings && !settings.$expand)
				settings.$expand = 'properties,inbound-relations,outbound-relations,inbound-entities,outbound-entities';
			var deferred = $q.defer();
			Entity.query(settings).$promise
			.then(function(data){
				if(self.querySettings.limit){
					if(!self.querySettings.$offset)
						self.batchLoadedMasterData = data;//invalidate cached data
					else
						self.batchLoadedMasterData = [].concat(self.batchLoadedMasterData, data);//append next page of data
				} else {
					self.batchLoadedMasterData = data;//overwrite
				}
				self['$count']['val'] = data.$count;
				deferred.resolve(data);
			})
			.catch(function(error){
				deferred.resolve(error);
			});
			return deferred.promise;
		};
		
		function refresh(){
			this.batchLoadedMasterData = [];
			this.querySettings.$offset = 0;
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
					if(item.id == id ){
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
					if(item.name == name ){
						return true;
					}
					return false;
				})[0];
			if(itemHit) {
				return $q.when(itemHit);
			} else if(lookupRemotelyOnDemand) {
				return Entity.getByName({"name":name, $filter:"name"}).$promise
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
		this.findByName = function(name, expand){
			var params = {"label":name, "$filter":"label"}
			if(expand!=undefined)
				params['$expand'] = expand;
			return EntityQueryByName.queryByName(params).$promise;
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
					self.querySettings.$offset = self.batchLoadedMasterData.length;
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
			var entity = template;
			if(!entity){
				entity = this.masterDataTemplateObject = createMasterDataTemplateObject();
				entity.name = Utils.randomAlphanumeric();
				entity.properties.map(function(prop){
					prop.entityName = entity.name;
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
			// push upsert/remove requests for dependencies
			if(header.properties){
				var props = header.properties.filter(function(item){
					if(!item.action){
						return false;
					}
					return true;
				});
				var promises = props.map(function(item) {
					var action = item.action;
					delete item.action;
					var $promise;
					if(action === 'remove') {
			        	$promise = Item.remove({boId: item.id}).$promise;
		        	} else {
	        			$promise = Item[action]({boId: item.id}, item).$promise;
	        		}
	        		return $promise;
		    	});
			}
			if(header["outbound-relations"]){
				var rels = header["outbound-relations"].filter(function(item){
					if(!item.action){
						return false;
					}
					return true;
				});
				promises = promises.concat(rels.map(function(item) {
					var action = item.action;
					var $promise;
					if(action === 'remove') {
			        	$promise = Relation.remove({boId: item.id}).$promise;
		        	} else {
		        		var _itemCopy = JSON.parse(JSON.stringify(item));
		        		delete _itemCopy.action;
		        		$promise = Relation[action]({boId: _itemCopy.id}, _itemCopy).$promise;
	        		}
	        		return $promise;
		    	}));
		    	//update join entities, if any
		    	/*for(var i=0; i< rels.length; i++){
		    		var joinEntity = rels[i].joinEntity;
					var action = rels[i].action;
					var $promise;
					if(action === 'remove') {
			        	$promise = Entity.remove({boId: joinEntity.id}).$promise;
		        	} else {
	        			$promise = Entity[action]({boId: joinEntity.id}, joinEntity).$promise;
	        		}
			    	promises = promises.concat($promise);
		    	}	*/	    	
		    	//update join properties in relations targets, if any
		    	for(var i=0; i< rels.length; i++){
		    		var targetEntity = rels[i].target;
					var relAction = rels[i].action;
			    	promises = promises.concat(targetEntity.properties.map(function(item) {
			    		var $promise;
			    		var action = item.action;
			    		if(relAction && item.action){
							delete item.action;
							if(action === 'remove') {
					        	$promise = Item.remove({boId: item.id}).$promise;
				        	} else {
			        			$promise = Item[action]({boId: item.id}, item).$promise;
			        		}
			    		}
		        		return $promise;
			    	}));
		    	}
			}
			//finally, push request for update for the header too
			promises.unshift(Entity.update({boId: header.id}, header).$promise);
			//promises.push(refresh.apply(self));
	    	return $q.all(promises).then(function(){
	    		refresh.apply(self);
	    	});
		};	
		
		this.remove = function(headerId){
			var reqParams = {};
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
			if(errorPayload.data&& errorPayload.data.err.code){
				message += ': [' + errorPayload.data.err.code + '] ';
			}
			if(errorPayload.data && errorPayload.data.err.message){
				message += ' ' + errorPayload.data.err.message;
			}
			return message;
		};
		
		this.exportData = function(){
			$log.info('Exporting data');
			return Entity.query({$expand:'properties,inbound-relations'}).$promise;//TODO: remove ids
		};
		
		
		return this;
/*		return {
			masterDataTemplateObject: this.masterDataTemplateObject,
			loadedData: this.batchLoadedMasterData,
			querySettings: this.querySettings,
			selection: this.selection,
			getLoadedData: this.getLoadedData,
			next: this.next,
			get: this.get,
			getByName: this.getByName,
			findByName: this.findByName,
			hasMore: this.hasMore,
			_itemsCount: this._itemsCount,
			count: this.count,
			select: this.select,
			create: this.create,
			update:this.update,
			remove: this.remove,
			serviceErrorMessageFormatter: this.serviceErrorMessageFormatter,
			exportData: this.exportData
		};*/
				
	}])
	.service('SQLEntity', ['Utils', function(Utils){
		return {
			formatTableName: function(string, upperCase, maxLength){
				maxLength =  maxLength || 125;
				var letterCaseMethod = upperCase===false?'toLowerCase':'toUpperCase';
				return Utils.transformToAlphanumeric(string)[letterCaseMethod]().substring(0, maxLength);
			},
			formatFieldName: function(string, upperCase, maxLength){
				maxLength =  maxLength || 255;
				var letterCaseMethod = upperCase===false?'toLowerCase':'toUpperCase';
				return Utils.transformToAlphanumeric(string)[letterCaseMethod]().substring(0, maxLength);
			}		
		};
	}])		
	.service('Settings', ['BuildTemplatesService', function(BuildTemplatesService) {
		return {
			"expert-mode": false,
			"publishAfterBuild": true,
			"getTemplates": function(){
				return BuildTemplatesService.listTemplates().$promise;
			}
		};
	}]);
})(angular);
