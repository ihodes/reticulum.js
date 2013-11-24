/* jslint node: true */
'use strict';


var _ = require('underscore'),
    U = require('../utils');


var reifyParams = function(context, params) {
    return _.map(params, _.partial(reifyParam, context));
};

var reifyParam = function(context, param) {
    if (_.isNumber(param) || _.isBoolean(param) || _.isNull(param))  return param;

    if (_.isArray(param)) { // then we need to join it
        return reifyParams(context, param).join('');
    } else if (param.indexOf('=') >= 0) { // then we're dealing with a key/val string
        var keyVal = param.split('=');
        return keyVal[0] + "=" + reifyParam(context, keyVal[1]);
    } else if (_.isString(param)) {
        var firstChar = param.charAt(0);
        switch (firstChar) {
            case '.': // local context or args
              if (param.charAt(1) === '.') // then, ..args
                  param = U.getIn(param.slice(2).split('.'), null, context.event);
              else param = U.getIn(param.slice(1).split('.'), null, context.local);
              break;
            case '@': // user context TK TODO
              param = U.getIn(param.slice(1).split('.'), null, context.user);
              break;
            case '!': // global context
              if (param.charAt(1) === '!') {
                  var paramFn = U.getIn(param.slice(2).split('.'), null, context.global);
                  param = paramFn(); // GLOBAL_PARAMS are functions
              }
              break;
            case '\\': // escaping a special char
              param = param.slice(1);
              break;
        }
        return param;
    }
    else return param;
};

function reifyObject(context, obj) {
    return _.reduce(obj, function(mem, val, key) {
        if (_.isObject(val))  mem[key] = reifyObject(context, val);
        else                  mem[key] = reifyParam(context, val);
        return mem;
    }, {});
}


// Assigns val to the keyPath in context.
//
// e.g. If context is {} and keypath is ['a', 'nested', 'path']
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

var deleteIn = function(context, keyPath) {
    var key = _.first(keyPath);
    if (!context)  return;
    if (keyPath.length === 1)  return delete context[key];
    deleteIn(context[key], keyPath.slice(1));
};



_.extend(exports, {setIn: setIn, deleteIn: deleteIn,
                   reifyParams: reifyParams, reifyObject: reifyObject,
                   reifyParam: reifyParam});
