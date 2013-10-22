/* jslint node: true */
'use strict';

var _           = require('underscore'),
    logger      = require('./logger').logger,
    request     = require('httpsync').request,
    db          = require('../models/db'),
    fsmInstance = require('../models/fsmInstance'),
    fsm         = require('../models/fsm');


// All actions and guards get treated the same way;  They are curried functions
// which first take  the current FSM instance locals, then  the last eventName,
// then the last event's args (in the form of an object). Then they are applied
// to the arguments passed to them via the FSM (an array of reified params).
exports.ACTIONS = {
    'log': function(locals, userContext, eventName, eventArgs) {
        return function() {
            var args = _.toArray(arguments);
            args = _.map(args, function(val) {
                if (_.isObject(val))
                    return JSON.stringify(val, undefined, 2);
                else return val;
            });
            logger.info.apply(null, _.cons("User: "+userContext._id+" from FSM instance: ", args));
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
    'request': function(locals, userContext, eventName, eventArgs) {
        return function(method, url, body, storeInKey) {
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
