/* jslint node: true */
'use strict';


var _ = require('underscore'),
    H = require('./helpers'),
    request = require('request');
require('underscore-contrib');



// Reifies a FSM, setting the given key to the ID of the resulting instance.
//
// [reify <fsmId> <initialLocals>? <keyName>]
//
// Where `fsmId` is the ID of the FSM to be reified, `initialLocals` (optional)
// is a JSON object of locals the FSM should be initialized with, and `keyName`
// is the local key (or key path) which will store the ID of the resultant FSM
// instance.
//
// All parameters may be keys.
function reifyFn(params, context, response, next) {
    params = H.reifyParams(context, params);
    var fsmId   = _.first(params),
        keyName = _.last(params),
        keyPath = keyName.split('.'),
        baseUrl = context.global['BASE_URL'](),
        apiV    = context.global['API_VERSION'](),
        url     = baseUrl + '/' + apiV + '/fsm/' + fsmId + '/reify',
        initialLocals, req;
    if (params.length === 3)  initialLocals = params[1];

    req = { auth:   { user: '', pass: context.user._key },
            json:   initialLocals || {},
            method: 'POST',
            url:    url};

    request(req, function(err, r, resp) {
        console.log("HURRRRRR");
        H.setIn(context.local, keyPath, resp);
        next(context, response, true);
    });
}

// Sends a message and args to a FSM instance, setting the given key to the result
// of the operation.
//
// [send <fsmInstanceId> <message> <args>? <key>]
//
// Where `fsmInstanceId` is the ID of the FSM instance to be sent the message,
// `message` is the string message to be sent to the instance, and `args` (optional)
// is a JSON object of args to send along with the message.
//
// All parameters may be keys.
function sendFn(params, context, response, next) {
    params = H.reifyParams(context, params);
    var fsmIId  = _.first(params),
        message = params[1],
        keyName = _.last(params),
        keyPath = keyName.split('.'),
        baseUrl = context.global['BASE_URL'](),
        apiV    = context.global['API_VERSION'](),
        url     = baseUrl + '/' + apiV + '/fsm/_/' + fsmIId + '/send/' + message,
        args, req;
    if (params.length === 4)  args = params[2];

    req = { auth:   { user: '', pass: context.user._key },
            json:   args || {},
            method: 'POST',
            url:    url};

    request(req, function(err, r, resp) {
        H.setIn(context.local, keyPath, resp);
        next(context, response, true);
    });
}


exports.functions = {
    'reify': reifyFn,
    'send': sendFn
};
