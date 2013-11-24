/* jslint node: true */
'use strict';


var config = require('../config');



exports.GLOBAL_PARAMS = {
    'NOW': function () {
        return Date.now();
    },
    'API_VERSION': function () {
        return config.settings.API_VERSION;
    },
    'BASE_URL': function () {
        return config.settings.BASE_URL;
    }
};
