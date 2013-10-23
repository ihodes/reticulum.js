/* jslint node: true */
'use strict';

var _           = require('underscore'),
    logger      = require('./logger').logger,
    request     = require('httpsync').request,
    arequest    = require('request'),
    db          = require('../models/db'),
    fsmInstance = require('../models/fsmInstance'),
    fsm         = require('../models/fsm');


// All actions and guards get treated the same way;  They are curried functions
// which first take  the current FSM instance locals, then  the last eventName,
// then the last event's args (in the form of an object). Then they are applied
// to the arguments passed to them via the FSM (an array of reified params).
// 
// actions are passed, in order, locals, userContext, eventName, eventArgs, res
// where res is the response object from express.js/connect.js
exports.ACTIONS = {
    'log': function(locals, userContext, eventName, eventArgs) {
        return function() {
            var args = _.toArray(arguments);
            args = _.map(args, function(val) {
                if (_.isObject(val))
                    return JSON.stringify(val, undefined, 2);
                else return val;
            });
            logger.info.apply(null, _.cons("User: " + userContext._id + " from FSM instance: ", args));
            return true;
        };
    },
    'if': function(locals, userContext, eventName, eventArgs) {
        return function() {
            var args = _.toArray(arguments);
            var testType = args[0];
            if (testType === 'eq') {
                return eventName === args[1];
            } else if (testType === 'neq') {
                return eventName !== args[1];
            } else {
                return false;
            }
        };
    },
    'end': function() {
        return function() {
            return false;
        };
    },
    'set': function(locals, userContext, eventName, eventArgs) {
        return function(keys, val) {
            var keyPath = keys.split('.');
            setIn(locals, keyPath, val);
            return true;
        };
    },
    'clear': function(locals, userContext, eventName, eventArgs) {
        return function(keys) {
            var keyPath = keys.split('.');
            setIn(locals, keyPath, undefined);
            return true;
        };
    },
    'text': function(locals, userContext, eventName, eventArgs) {
        return function(number, message) {
            var url = "https://api.twilio.com/2010-04-01/Accounts/"
                + userContext.twilioAccountSID
                + "/Messages.json";
            if (_.some(_.pluck(userContext, 'twilioAccountSID',
                               'twilioAuthToken',
                               'twilioNumber'))) {
                logger.error("To use `text`, user context must include twilioAccountSID, twilioAuthToken, and twilioNumber.");
                return false;
            }
            var auth = { user: userContext.twilioAccountSID,
                         pass: userContext.twilioAuthToken };
            var body = { From: userContext.twilioNumber,
                         To: number,
                         Body: message };
            arequest.post(url, {form: body, auth: auth}, function(err, response, body){
                logger.info(JSON.stringify(body));
            });
            return true;
        };
    },
    'push': function(locals, userContext, eventName, eventArgs) {
        return function(deviceToken, message) {
            if (!_.some(_.pluck(userContext, 'urbanAirshipKey',
                                'urbanAirshipSecret'))) {
                logger.error("To use `push`, user context must include urbanAirshipKey and urbanAirshipSecret.");
                return false;
            }
            var url = "https://go.urbanairship.com/api/push/";
            var auth = { user: userContext.urbanAirshipKey,
                         pass: userContext.urbanAirshipSecret };
            var body = { device_tokens: [deviceToken],
                         aps: { alert: message } };
            arequest.post(url, {body: body, auth: auth}, function(err, response, body){
                logger.info("PUSHED: " + JSON.stringify(body));
            });
            return true;
        };
    },
    'request': function(locals, userContext, eventName, eventArgs) {
        return function(method, url, body, storeInKey) {
            // TK NOTE & TK TODO: doing this synchronously right now, as we need
            //                    to store the result in the locals before they're
            //                    returned and saved in our database... should improve.
            var headers = {'Content-Type':'application/json; charset=utf-8'};
            var req = request({url: url, method: method, headers: headers});
            req.write(body);
            var data = String(req.end().data);
            if (storeInKey) {
                var keyPath = storeInKey.split('.');
                setIn(locals, keyPath, JSON.parse(data));
            }
            return true;
        };
    },
    'respond': function(locals, userContext, eventName, eventArgs, res) {
        return function() {
            var args = _.chain(_.toArray(arguments))
                        .invoke('split', '=')
                        .object()
                        .value();
            res.send(args);
            return false;
        };
    },
    'reify': function(locals, userContext) {
        return function(fsmName, key) { 
            var locals = _.chain(_.toArray(arguments).slice(2))
                          .invoke('split', '=')
                          .object()
                          .value();
            var query = { name: fsmName, user: userContext._id };
            return fsmInstance.reifyFsm(query, locals, function(err, fsmInstance) {
                var keyPath = keys.split('.');
                setIn(locals, keyPath, fsmInstanceId);

                if (err || !fsmInstance) return false;
                else return true;
            });
        };
    },
    'send': function(locals, userContext) {
        return function(fsmInstanceId, eventName) { 
            var args = _.chain(_.toArray(arguments).slice(2))
                        .invoke('split', '=')
                        .object()
                        .value();
            var query = { _id: fsmInstanceId, user: userContext._id };
            return fsmInstance.sendEvent(query, eventName, args, function(err, fsmInstance) {
                if (err || !fsmInstance) return false;
                else return true;
            });
        };
    }
};




// Assigns val to the keyPath in context.
//
// e.g. if context if {} and keypath is ['a', 'nested', 'path']
//      then setIn(context, keypath, 'someval') mutates context to be
//      {a: { nested: { path: 'someval'}}
//
// NB: mutates context!
var setIn = function(context, keyPath, val) {
    var key = _.first(keyPath);
    if (keyPath.length === 1) {
        context[key] = val;
    } else {
        if (_.isArray(context[key]) || !_.isObject(context[key]))
            context[key] = {};
        setIn(context[key], keyPath.slice(1), val);
    }
};
