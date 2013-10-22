'use strict';

var mongoose = require('mongoose'),
    config   = require('../config'),
    _        = require('underscore'),
    logger   = require('../lib/logger').logger,
    U        = require('../lib/utils'),
    loch     = require('loch'),
    crypto   = require('crypto');
require('underscore-contrib');
var ObjectId = mongoose.Schema.ObjectId;



var randomStringMaker = function(len) {
    return function() {
        return crypto.randomBytes(len).toString('hex');
    };
};


var userSchema = new mongoose.Schema({
    createdAt:    { type: Date,    default: Date.now },
    name:         { type: String,  required: true, unique: true },
    key:          { type: String,  required: true },
    superuser:    { type: Boolean, default: false },

    context:      { type: Object, default: {}, required: true }
}, { minimize: false });
userSchema.post('save', function(doc) {
    logger.info('Saved user: ' + JSON.stringify(doc.toObject()));
});
exports.user = mongoose.model('user', userSchema);


var fsmSchema = new mongoose.Schema({
    createdAt:    { type: Date,     default: Date.now },
    user:         { type: ObjectId, required: true, ref: 'user' },

    fsm:          { type: Object,   required: true },
    name:         { type: String,   required: true },
    description:  { type: String },
}, { minimize: false });
fsmSchema.post('save', function(doc) {
    logger.info('Saved fsm: ' + JSON.stringify(doc.toObject()));
});
exports.fsm = mongoose.model('fsm', fsmSchema);


var fsmInstanceSchema = new mongoose.Schema({
    auth:             { type: String,   default: randomStringMaker(32),
                        required: true },

    createdAt:        { type: Date,     default: Date.now },
    user:             { type: ObjectId, required: true, ref: 'user' },

    fsm:              { type: ObjectId, ref: 'fsm', required: true },
    locals:           { type: Object,   required: true, default: {} },
    currentStateName: { type: String,   required: true },
    lastEvent:        { type: {name: String, args: Object},
                        default: {name: null, args: {}} }
}, { minimize: false });
fsmInstanceSchema.post('save', function(doc) {
    logger.info('Saved fsm instance: ' + JSON.stringify(doc.toObject()));
});
exports.fsmInstance = mongoose.model('fsmInstance', fsmInstanceSchema);



var connect = function() {
    mongoose.connect(config.settings.MONGO_URL);

    mongoose.connection.on('error', function() {
        logger.error('Mongoose error: ' + config.settings.MONGO_URL);
    });

    mongoose.connection.on('connecting', function() {
        logger.info('Mongoose connecting: ' + config.settings.MONGO_URL);
    });

    mongoose.connection.on('connected', function() {
        logger.info('Mongoose connected: ' + config.settings.MONGO_URL);
    });

    mongoose.connection.on('open', function() {
        logger.info('Mongoose open: ' + config.settings.MONGO_URL);
    });

    mongoose.connection.on('disconnecting', function() {
        logger.warn('Mongoose disconnecting: ' + config.settings.MONGO_URL);
    });

    mongoose.connection.on('disconnected', function() {
        logger.warn('Mongoose disconnected: ' + config.settings.MONGO_URL);
    });

    mongoose.connection.on('close', function() {
        logger.info('Mongoose close: ' + config.settings.MONGO_URL);
    });

    mongoose.connection.on('reconnected', function() {
        logger.info('Mongoose reconnected: ' + config.settings.MONGO_URL);
    });

    mongoose.connection.on('fullsetup', function() {
        logger.info('Mongoose fullsetup: ' + config.settings.MONGO_URL);
    });
};

connect();
