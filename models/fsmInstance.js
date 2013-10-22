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
                           locals:           locals,
                           user:             fsm.user };
        return db.fsmInstance(initFields).save(callback);
    });
};

exports.getFsmInstance = function(query, params, callback) {
    return db.fsmInstance.findOne(query, callback);
};

exports.sendEvent = function(query, evt, params, callback) {
    db.fsmInstance.findOne(query)
      .populate('fsm')
      .exec(function(err, fsmInstance) {
          if (err || !fsmInstance) return callback(err, null);
          var fsmi = { fsm:              fsmInstance.fsm.fsm,
                       currentStateName: fsmInstance.currentStateName,
                       lastEvent:        fsmInstance.lastEvent,
                       locals:           fsmInstance.locals };
          db.user.findOne({ _id: fsmInstance.user }, function(err, user) {
            if (err || !user) return callback(err, null);
            var userContext = _.extend(user.context, {_id: user._id});
            var fsmi_  = reticulum.send(fsmi, userContext, evt, params, res);
            var updateFields = _.pick(fsmi_, 'currentStateName', 'lastEvent', 'locals');
            return db.fsmInstance.findOneAndUpdate(query, updateFields, callback);
          });
      });
};


// Basic Auth
exports.authenticator = function(__, key, callback) {
    db.fsmInstance.findOne({auth: key}, callback);
};
