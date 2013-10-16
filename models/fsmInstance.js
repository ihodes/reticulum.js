'use strict';

var _         = require('underscore'),
    db        = require('./db'),
    config    = require('../config'),
    utils     = require('../lib/utils'),
    reticulum = require('../lib/reticulum'),
    logger    = require('../lib/logger').logger;



exports.allFsmInstances = function(user, params, callback) {
    db.fsmInstance.find({user: user}, callback);
};

exports.reifyFsm = function(user, fsmId, locals, callback) {
    db.fsm.findOne({_id: fsmId, user: user}, function(err, fsm) {
        if (err || !fsm) return callback(err, null);
        var fsm        = fsm.fsm;
        var initFields = { fsm: fsmId, currentStateName: fsm.initialStateName, locals: locals, user: user };
        db.fsmInstance(initFields).save(callback);
    });
};

exports.getFsmInstance = function(user, fsmInstanceId, params, callback) {
    db.fsmInstance.findOne({_id: fsmInstanceId, user: user}, callback);
};

exports.sendEvent = function(user, fsmInstanceId, fsmId, evt, params, callback) {
    db.fsmInstance.findOne({_id: fsmInstanceId, user: user})
      .populate('fsm')
      .exec(function(err, fsmInstance) {
          if (err || !fsmInstance) return callback(err, null);
          var fsmi = {fsm: fsmInstance.fsm.fsm, currentStateName: fsmInstance.currentStateName,
                      lastEvent: fsmInstance.lastEvent, locals: fsmInstance.locals};
          var newInstance  = reticulum.send(fsmi, user.context, evt, params);
          var updateFields = _.pick(newInstance, 'currentStateName', 'lastEvent', 'locals');
          db.fsmInstance.findOneAndUpdate({_id: fsmInstance._id, user: user}, updateFields, callback);
      });
};
