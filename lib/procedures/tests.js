/* jslint node: true */
'use strict';


var _ = require('underscore'),
    H = require('./helpers');



function eqFn(params, context, response, next) {
    params = H.reifyParams(context, params);
    next(context, response, params[0] == params[1]);
}

function neqFn(params, context, response, next) {
    params = H.reifyParams(context, params);
    next(context, response, params[0] != params[1]);
}

function existsFn(params, context, response, next) {
    var a = H.reifyParam(context, params[0]);
    next(context, response, !(_.isNull(a) || _.isUndefined(a)));
}


exports.functions = {
    '==':       eqFn,
    '!=':       neqFn,
    'exists?':  existsFn
};

