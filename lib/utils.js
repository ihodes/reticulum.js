'use strict';

var _      = require('underscore'),
    logger = require('./logger').logger;
require('underscore-contrib');


var TIME_REGEX = /^(0?\d|1\d|2[0123]):[012345]\d$/;

var complement = function(fn) {
    return function() {
        return !fn.apply(null, _.toArray(arguments));
    };
};
exports.complement = complement;


var constantly = function(v) { return function() { return v; }; };
var object     = function(k,v) { return _.object([k], [v]); }
var existy     = function(v) { return !(v === undefined) && !(v === null); };
var falsey     = function(v) { return !existy(v) || (v === false); };
var truthy     = function(v) { return !falsey(v); };
var o = object;
_.extend(exports, {object: object, existy: existy, falsey: falsey, truthy: truthy,
                   constantly: constantly});

var rest = function(list) { return list.slice(1, list.length); };
var last = function(list) { return list[list.length - 1]; };

// Returns an object containing all keys of all objects supplied, with keys in
// objects to the right taking precidence over those to the left. Objects must
// be JSON objects (json.org), and this operation goes all the way down.
// (it's recursive)
var deepMergeJSON = function(/* objects */) {
    return _.reduce(_.toArray(arguments), _deepMergeJSON, {});
};
exports.deepMergeJSON = deepMergeJSON;

var _deepMergeJSON = function(mergee, merger) {
    mergee = deepCloneJSON(mergee);
    
    _.each(merger, function(val, key) {
        if (!_.has(mergee, key))
            mergee[key] = val;
        else if (_.isArray(val) && _.isArray(mergee[key]))
            mergee[key] = mergee[key].concat(val);
        else if (_.isObject(val) && _.isObject(mergee[key]))
            mergee[key] = _deepMergeJSON(mergee[key], val);
        else
            mergee[key] = val;
    });
    return mergee;
};
exports._deepMergeJSON = _deepMergeJSON;

var deepCloneJSON = function(json) {
    return JSON.parse(JSON.stringify(json));
};
exports.deepCloneJSON = deepCloneJSON;


  ////////////////////////////
 //       For Routes       //
////////////////////////////

var ERRORS = {
    badRequest:          {status: 400, error: "Bad Request",
                          message: "Missing or bad parameter(s)."},
    unauthorized:        {status: 401, error: "Unauthorized",
                          message: "Missing API Key."},
    requestFailed:       {status: 402, error: "Request Failed",
                          message: "Parameters valid, but request failed."},
    notFound:            {status: 404, error: "Not Found",
                          message: "Resource does not exist."},
    methodNotAllowed:    {status: 405, error: "Method Not Allowed",
                          message: "Method not allowed for resource."},
    internalServerError: {status: 500, error: "Internal Server Error",
                          message: "There has been an error."}
}
exports.ERRORS = ERRORS;


// Use as a simple callback which sends the results or errors to the response
// object `res`. Calls `transform` on the object.
// 
// If status is not provided, assumes 200.
//
// `sendBack` also processes some errors, as follows:
// (If ... , then send ERRORS.requestFailed) not implemented
// If there is no result, then send ERRORS.notFound.
// If there is some other error, then send ERRORS.internalServerError
exports.sendBack = function(res, status, transform) {
    if (existy(status)) {
        if (_.isFunction(status)) {
            transform = status;
            status = undefined;
        }
    }
    return function(err, results) {
        if (!results) {
            logger.warn('[utils::sendBack] 404 No result returned: (' + err + ')')
            return error(res, ERRORS.notFound);
        }

        // Because of silliness with the objects that Mongoose returns...
        if (_.isArray(results)) results = _.invoke(results, 'toObject');
        else results = results.toObject();

        if (err) {
            logger.error('[utils::sendBack] Internal 500 error occured: ' + err);
            return error(res, ERRORS.internalServerError);
        }

        if (!existy(status)) status = 200;

        if (_.isFunction(transform)) 
            return res.send(transform(results), status);
        else
            return res.send(results, status);
    }
};


// Send an error with appropriate status code (from ERRORS) to the response
// object `res`. Pass `addnl` (object) to add more information to the error.
//
// e.g. If a resourse is not found:
//      error(res, ERRORS.notFound);
//      // (to `res`) => HTTP/1.1 404 Not Found  ...
//      //               {status: 404, error: "Not Found" ... }
//
var error = function(res, err, addnl) {
    return res.status(err.status).send(_.extend(err, addnl));
}
exports.error = error;



// DEBUG fns
var printer = function(o) {
    console.log(o);
    return o;
}
exports.printer = printer;

var getter = function(key) { return function(o) { return o[key]; }};


// for display sanitation
var _idToId = exports._idToId = function(id) {
    return { id: id };
};
