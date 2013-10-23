'use strict';

var _      = require('underscore'),
    db     = require('./db'),
    config = require('../config'),
    utils  = require('../lib/utils'),
    logger = require('../lib/logger').logger;


exports.allUsers = function(user, params, callback) {
    if (!user.superuser) return callback(null, null);
    db.user.find({}, callback);
};

exports.createUser = function(user, params, callback) {
    if (!user.superuser) return callback(null, null);
    db.user(params).save(callback);
};

exports.updateUser = function(user, userId, params, callback) {
    if (!user.superuser || (user.id !== userId)) return callback(null, null);
    db.user.findByIdAndUpdate(userId, params, callback);
};

exports.setContext = function(user, userId, context, callback) {
    if (!user.superuser && (user.id !== userId)) return callback(null, null);
    db.user.findByIdAndUpdate(userId, {'$set': { context: context }}, callback);
};

exports.getUser = function(user, userId, callback) {
    if (!user.superuser && (user.id !== userId)) return callback(null, null);
    db.user.findById(userId, callback);
};


// Basic Auth
exports.authenticator = function(__, key, callback) {
    db.user.findOne({key: key}, callback);
};
