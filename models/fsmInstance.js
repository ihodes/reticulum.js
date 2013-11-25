'use strict';

var _         = require('underscore'),
    db        = require('./db'),
    config    = require('../config'),
    utils     = require('../lib/utils'),
    reticulum = require('../lib/reticulum'),
    logger    = require('../lib/logger').logger;



exports.allFsmInstances = function(query, callback) {
    db.fsmInstance.find(query, callback);
};

exports.reifyFsm = function(query, locals, callback) {
    db.fsm.findOne(query, function(err, fsm) {
        if (err || !fsm) return callback(err, null);
        var initFields = { fsm:              fsm._id,
                           currentStateName: fsm.fsm.initialStateName,
                           locals:           locals || {},
                           user:             fsm.user };
        return db.fsmInstance(initFields).save(callback);
    });
};

exports.getFsmInstance = function(query, params, callback) {
    return db.fsmInstance.findOne(query, callback);
};


// Sends the event to a FSM instance, executing all actions and causing any 
// transitions which should happen. Updates FSM instance in the DB.
//
// `query`  is the query used to look up the FSM instance to send the event to.
//
// `event` is of form { name: 'eventName', args: {.. event args ..} }
//
// `callback` is called with error, fsmi the new FSM instance, and the response object
exports.sendEvent = function(query, event, callback) {
    db.fsmInstance.findOne(query)
      .populate('fsm')
      .exec(function(err, fsmInstance) {
          if (err || !fsmInstance)  return callback(err, null);
          
          db.user.findOne({ _id: fsmInstance.user }, function(err, user) {
              if (err || !user)  return callback(err, null);

              var fsmi     =  _fsmiFromDoc(fsmInstance),
                  addlCtx  = {_id: user._id, _name: user.name, _key: user.key},
                  userCtx  =  _.extend(user.context, addlCtx);

              try {
                reticulum.send(fsmi, userCtx, event, function(fsmi, response) {
                    var fields =_.pick(fsmi, 'currentStateName', 'lastEvent', 'locals');
                    db.fsmInstance.findOneAndUpdate(query, fields, function(err, fsmi) {
                        return callback(err, fsmi, response);
                    });
                });
              } catch (err) {
                return callback(err.name + ': ' + err.message, null, null);
              }
          });
      });
};


// Basic Auth
exports.authenticator = function(__, key, callback) {
    db.fsmInstance.findOne({auth: key}, callback);
};


// Helpers
function _fsmiFromDoc(fsmInstance) {
    return { fsm:              fsmInstance.fsm.fsm,
             currentStateName: fsmInstance.currentStateName,
             lastEvent:        fsmInstance.lastEvent,
             locals:           fsmInstance.locals };
}
