/* jslint node: true */
'use strict';


var _ = require('underscore'),
    H = require('./helpers'),
    logger = require('../logger').logger;



function logFn(params, context, response, next) {
    var args = H.reifyParams(context, _.toArray(arguments));
    args = _.map(args, function(val) {
        if (_.isObject(val))
            return JSON.stringify(val, undefined, 2);
        else return val;
    });
    logger.info.apply(null, _.cons("User: " + userContext._id + " from FSM instance: ", args));
    next(context, response, true);
}


exports.functions = {
    'log': logFn
};
