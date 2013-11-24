/* jslint node: true */
'use strict';


var _ = require('underscore'),
    H = require('./helpers');



function respondFn(params, context, response, next) {
    response.body = H.reifyObject(context, params[0]);
    next(context, response, true);
}


exports.functions = {
    'respond': respondFn
};
