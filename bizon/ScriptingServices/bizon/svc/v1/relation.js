/* globals $ */
/* eslint-env node, dirigible */
"use strict";
	
var relationDAO = require("bizon/lib/relation_dao").get();
var DataService = require("arestme/data_service").DataService;
new DataService(relationDAO).service();