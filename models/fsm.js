'use strict';

var _      = require('underscore'),
    db     = require('./db'),
    config = require('../config'),
    utils  = require('../lib/utils');


exports.allFsms = function(params, callback) {
    db.fsm.find({}, callback);
};

exports.createFsm = function(params, callback) {
    db.fsm({fsm: params.fsm}).save(callback);
};

exports.getFsm = function(fsmId, callback) {
    db.fsm.findOne({_id: fsmId}, callback);
};
