'use strict';

var _      = require('underscore'),
    logger = require('./logger').logger;
require('underscore-contrib');



// Use as a simple mongoose callback which sends the results or errors to the 
// response object `res`. Calls `transform` on the object.
// 
// If status is not provided, assumes 200.
//
// `sendBack` also processes some errors, as follows:
// (If ... , then send ERRORS.requestFailed) not implemented
// If there is no result, then send ERRORS.notFound.
// If there is some other error, then send ERRORS.internalServerError
// If dontSend is true, doesn't res.send, instread returns the transform(ed) results
var sendBack = function(res, status, transform, dontSend) {
    status    = status || 200;
    if (_.isFunction(status)) {
        dontSend = transform;
        transform = status;
        status = 200;
    }
    transform = transform || _.identity;

    return function(err, results) {
        if (!results) {
            logger.error('Document not found: ' + JSON.stringify(err))
            return error(res, ERRORS.notFound);
        } else if (err) {
            switch (err.code) {
                case 11001:
                case 11000:
                  logger.error('Database error, duplicate key: ' + JSON.stringify(err));
                  var path = err.path;
                  return error(res, ERRORS.badRequest,
                               {errors: { path: 'duplicate value' }});
                  break;
                default:
                  logger.error('Database error, critical: ' + JSON.stringify(err));
                  return error(res, ERRORS.internalServerError,
                               {error: 'database error: ' + JSON.stringify(err)});
            }
        }

        if (_.isArray(results)) results = _.invoke(results, 'toObject');
        else results = results.toObject();

        if (dontSend) return transform(results);
        else return res.send(transform(results), status);
    };
};
exports.sendBack = sendBack;



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



  ////////////////////////////
 //       For Routes       //
////////////////////////////

var ERRORS = {
    badRequest:          {status: 400, error: "Bad Request",
                          message: "Missing or bad parameter(s)."},
    unauthorized:        {status: 401, error: "Unauthorized",
                          message: "Missing or incorrect API Key."},
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



// DEBUG fns
var printer = function(o) {
    console.log(o);
    return o;
}
exports.printer = printer;

var getter = function(key) { return function(o) { return o[key]; }};
exports.getter = getter;

// for display sanitation
var _idToId = function(id) {
    return { id: id };
};
exports._idToId = _idToId;


var complement = function(fn) { return function() { return !fn.apply(null, _.toArray(arguments)); }; };
var constantly = function(v) { return function() { return v; }; };
var object     = function(k,v) { return _.object([k], [v]); }
var existy     = function(v) { return !(v === undefined) && !(v === null); };
var falsey     = function(v) { return !existy(v) || (v === false); };
var truthy     = function(v) { return !falsey(v); };
var o = object;
_.extend(exports, {object: object, existy: existy, falsey: falsey, truthy: truthy,
                   constantly: constantly, always: constantly, K: constantly,
                   complement: complement});

