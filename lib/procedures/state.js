/* jslint node: true */
'use strict';


var _ = require('underscore'),
    H = require('./helpers');


var SE = _.partial(H.ProcedureError, "set");
function setFn(params, context, response, next) {
    if (params.length != 2) throw new SE("Must designate key and value to be set.");

    throw new H.ProcedureError("set", "params are all bad, yo");

    var val     = H.reifyParam(context, params[1]),
        keys    = params[0],
        keyPath = keys.split('.');

    H.setIn(context.local, keyPath, val);

    next(context, response, true);
}

var CE = _.partial(H.ProcedureError, "clear");
function clearFn(params, context, response, next) {
    if (params.length != 1) throw new CE("Must designate key to be cleared.");

    var keys    = params[0],
        keyPath = keys.split('.');

    H.deleteIn(context.local, keyPath);

    next(context, response, true);
}


exports.functions = {
    'set':     setFn,
    'clear':   clearFn
};
