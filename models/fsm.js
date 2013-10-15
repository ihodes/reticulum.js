'use strict';

var _      = require('underscore'),
    db     = require('./db'),
    config = require('../config'),
    utils  = require('../lib/utils'),
    logger = require('../lib/logger').logger;



exports.allFsms = function(user, params, callback) {
    db.fsm.find({user: user}, callback);
};

exports.createFsm = function(user, params, callback) {
    db.fsm(_.extend(params, {user: user})).save(callback);
};

exports.updateFsm = function(user, fsmId, params, callback) {
    db.fsm.findOneAndUpdate({_id: fsmId, user: user}, params, callback);
};

exports.getFsm = function(user, fsmId, callback) {
    db.fsm.findOne({_id: fsmId, user: user}, callback);
};
