'use strict';

var _         = require('underscore'),
    db        = require('./db'),
    config    = require('../config'),
    utils     = require('../lib/utils'),
    reticulum = require('../lib/reticulum'),
    logger    = require('../lib/logger').logger;


exports.allFsmMs = function(params, callback) {
    db.fsmM.find({}, callback);
};

exports.reifyFsm = function(fsmId, params, callback) {
    db.fsm.findOne({_id: fsmId}, function(err, fsm) {
        if (err || !fsm) return callback(err, null);
        var initialState = fsm.initialState;
        var fsm          = fsm.toObject()['fsm'];
        initialState     = params.initialStateName || initialState;
        var fsmM         = reticulum.reify(fsm, initialState);
        var updateFields = {fsm: fsmId, currentState: fsmM[1], history: fsmM[2]};
        db.fsmM(updateFields).save(callback);
    });
};

exports.getFsmM = function(fsmMId, params, callback) {
    db.fsmM.findById(fsmMId, callback);
};

exports.sendEvent = function(fsmMId, fsmId, evt, params, callback) {
    db.fsmM.findOne({_id: fsmMId})
      .populate('fsm')
      .exec(function(err, fsmM) {
          if (err || !fsmM) return callback(err, null);
          var fsm          = fsmM.fsm.fsm;
          var currFsmM     = [fsm, fsmM.currentState, fsmM.history];
          var nextFsmM     = reticulum.send(currFsmM, evt, params.args);
          var updateFields = {history: nextFsmM[2], currentState: nextFsmM[1]};
          db.fsmM.findByIdAndUpdate(fsmM._id, updateFields, callback);
      });
};
