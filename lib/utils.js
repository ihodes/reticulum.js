'use strict';

var _      = require('underscore'),
    logger = require('./logger').logger;
require('underscore-contrib');



// Use to construct a simple mongoose callback which sends the results or errors 
// to the response object `res`. Calls `transform` on the object, if given.
// If transform is given, and dontSend is true, then we do not call send on `res`;
// it is responsibility of the `transform` function to respond or not respond.
//
// res       :: the result object from express to be `send` to
//              (required)
// status    :: the HTTP status code to set on success (no errors, described below)
//              (default 200)
// transform :: function to be applied to the result of the Mongoose result (which
//              has had toObject() called on it.
//              (default identity function)
// dontSend  :: boolean; false if res will not be sent the result of the transform
//              function.
//              (default false)
//
// `sendBack` also processes some errors, as follows:
// If there is no result, then send ERRORS.notFound.
// If there is a duplicate key error, then send ERRORS.badRequest with
//    information on the key which was a duplicate.
// If there is some other error, then send ERRORS.internalServerError
var sendBack = function(res, status, transform, dontSend) {
    if (_.isFunction(status))
        dontSend  = transform,
        transform = status,
        status    = 200;
    status    = status    || 200;
    transform = transform || _.identity;

    return function(err, results) {
        if (!results) {
            logger.warn('Document not found, error: ' + JSON.stringify(err))
            return error(res, ERRORS.notFound);
        } else if (err) {
            var additionalInfo = {}, errType;
            switch (err.code) {
                case 11001:
                case 11000:
                  errType = 'duplicate value';
                  additionalInfo.errors = {};
                  additionalInfo.errors[err.path] = errType;
                  return error(res, ERRORS.badRequest, additionalInfo);
                  break;
                default:
                  errType = 'critical database error';
                  additionalInfo.error = errType;
                  return error(res, ERRORS.internalServerError, additionalInfo);
            }
            logger.error('Database error, '+errType+': ' + JSON.stringify(err));
        }

        if (_.isArray(results)) results = _.invoke(results, 'toObject');
        else                    results = results.toObject();

        if (dontSend) return transform(results);
        else          return res.send(transform(results), status);
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




// Returns the value at obj.key1.key2.....keyn
// when keys = [key1, key2, ... , keyn], or returns rem
// if that value doesn't exist/is falsey.
function getIn(keys, rem, obj) {
    if (_.isEmpty(keys))
        return obj;
    if (!obj || !obj[_.first(keys)])
        return rem;
    return getIn(_.rest(keys), rem, obj[_.first(keys)]);
}


var complement = function(fn) { return function() { return !fn.apply(null, _.toArray(arguments)); }; };
var constantly = function(v) { return function() { return v; }; };
var object     = function(k,v) { return _.object([k], [v]); }
var existy     = function(v) { return !(v === undefined) && !(v === null); };
var falsey     = function(v) { return !existy(v) || (v === false); };
var truthy     = function(v) { return !falsey(v); };
var o = object;
_.extend(exports, {object: object, existy: existy, falsey: falsey, truthy: truthy,
                   constantly: constantly, always: constantly, K: constantly,
                   complement: complement, getIn: getIn});

