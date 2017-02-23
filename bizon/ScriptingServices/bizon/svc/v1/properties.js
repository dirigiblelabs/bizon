/* globals $ */
/* eslint-env node, dirigible */
"use strict";

var itemDAO = require("bizon/lib/property_dao").get();
var DataService = require("arestme/data_service").DataService;
new DataService(itemDAO).service();
