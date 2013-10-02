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
        if (!fsm) return callback(err, null);
        var fsm = fsm.toObject()['fsm']
        var fsmM = reticulum.reify(fsm, 'stateA'); // TK TODO set initial state somewhere

        var fsmMfields = {fsmId: fsmId, currentState: fsmM[1], history: fsmM[2]};
        logger.debug("FSMM", JSON.stringify(fsmMfields));
        db.fsmM(fsmMfields).save(callback);
    });
};

exports.getFsmM = function(fsmMId, params, callback) {
    db.fsmM.findOne({_id: fsmMId}, callback);
};

exports.sendEvent = function(fsmMId, fsmId, evt, params, callback) {
    db.fsmM.findOne({_id: fsmMId}, function(err, fsmM) {
        db.fsm.findOne({_id: fsmId}, function(err, fsm) {
            /// WTF. TK TODO
            logger.debug('fsmM '+JSON.stringify(fsmM));
            return callback(err, fsmM);

            // var ff = fsmM;
            // var dbFsmM = fsmM.toObject();
            // var fsm = fsm.toObject();
            // var fsmM = [fsm, dbfsm.currentState, dbfsm.history];

            // var nextFsm = reticulum.send(fsmM, evt, []); // TK TODO put args here
            // logger.info('here')
            // db.fsmM.update({currentState: nextFsm.currentState,
            //                 history: nextFsm.history}, callback);
        });
    });
};
