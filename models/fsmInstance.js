'use strict';

var _         = require('underscore'),
    db        = require('./db'),
    config    = require('../config'),
    utils     = require('../lib/utils'),
    reticulum = require('../lib/reticulum'),
    logger    = require('../lib/logger').logger;


exports.allFsmInstances = function(params, callback) {
    db.fsmInstance.find({}, callback);
};

exports.reifyFsm = function(fsmId, params, callback) {
    db.fsm.findOne({_id: fsmId}, function(err, fsm) {
        if (err || !fsm) return callback(err, null);
        var fsm        = fsm.fsm;
        var initFields = {fsm: fsmId, currentStateName: fsm.initialStateName, locals: params};
        db.fsmInstance(initFields).save(callback);
    });
};

exports.getFsmInstance = function(fsmInstanceId, params, callback) {
    db.fsmInstance.findById(fsmInstanceId, callback);
};

exports.sendEvent = function(fsmInstanceId, fsmId, evt, params, callback) {
    db.fsmInstance.findOne({_id: fsmInstanceId})
      .populate('fsm')
      .exec(function(err, fsmInstance) {
          if (err || !fsmInstance) return callback(err, null);
          var fsmi = {fsm: fsmInstance.fsm.fsm, currentStateName: fsmInstance.currentStateName,
                      lastEvent: fsmInstance.lastEvent, locals: fsmInstance.locals};
          var newInstance  = reticulum.send(fsmi, evt, params);
          var updateFields = _.pick(newInstance, 'currentStateName', 'lastEvent', 'locals');
          db.fsmInstance.findByIdAndUpdate(fsmInstance._id, updateFields, callback);
      });
};
