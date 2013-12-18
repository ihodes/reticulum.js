/* jslint node: true */
'use strict';


var _ = require('underscore');
var logger = require('../logger').logger;


var PROCEDURE_MODULES = ['tests', 'fsm', 'loggers', 'state', 'request', 'response'];

// Each file must export a map called functions which maps strings to functions
// with signature (params, context, response, next)
//
// `params` is a list of parameters passed to the function in the FSM, including
// unreified parameters. It is the responsibility of the function to reify the
// params it says it will; this can be accomplished with the reifyParam
// functions in the `helpers` module.
//
// `context` is a map of form {event: {}, local: {}, user: {}, global: {}}
// where each map contains keys to values for that context.
// 
// `response` is an object with keys `headers` (object of headers::values),
// `body`, a string or Object (to be converted to JSON), `status`, HTTP status code,
// and `responded`, a boolean stating if a respond procedure has set the values
// therein, thereby indicating that the FSM should not set the values automatically.
//
// `next` is a function which must be called with `context`, `response`, 
// and boolean `proceed` which is `true` to continue 
// procedure execution within an action, or `false` to short-circuit the action.
//
// 
// c.f. the various procedures implemented herein for examples.

_.each(PROCEDURE_MODULES, function(fileName) {
    _.extend(exports, require('./'+fileName).functions);
});
