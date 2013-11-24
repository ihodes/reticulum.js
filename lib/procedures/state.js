/* jslint node: true */
'use strict';


var _ = require('underscore'),
    H = require('./helpers');



function setFn(params, context, response, next) {
    var val     = H.reifyParam(context, params[1]),
        keys    = params[0],
        keyPath = keys.split('.');

    H.setIn(context.local, keyPath, val);

    next(context, response, true);
}

function clearFn(params, context, response, next) {
    var keys    = params[0],
        keyPath = keys.split('.');

    H.deleteIn(context.local, keyPath);

    next(context, response, true);
}


exports.functions = {
    'set':     setFn,
    'clear':   clearFn
};
