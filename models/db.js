'use strict';

var mongoose = require('mongoose'),
    config   = require('../config'),
    _        = require('underscore'),
    logger   = require('../lib/logger').logger,
    U        = require('../lib/utils'),
    loch     = require('loch');
require('underscore-contrib');
var ObjectId = mongoose.Schema.ObjectId;


var fsmSchema = new mongoose.Schema({
    createdAt:    {type: Date, default: Date.now},
    fsm:          {type: Object},
});
fsmSchema.post('save', function(doc) {
    logger.info('Saved fsm: ' + JSON.stringify(doc.toObject()));
});
exports.fsm = mongoose.model('fsm', fsmSchema);


var fsmMSchema = new mongoose.Schema({
    createdAt:    {type: Date, default: Date.now},

    fsmId: {type: ObjectId, ref: 'fsm', required: true},
    currentState: {type: Object, required: true},
    history: [{type: Object}]
});
fsmMSchema.post('save', function(doc) {
    logger.info('Saved fsmM: ' + JSON.stringify(doc.toObject()));
});
exports.fsmM = mongoose.model('fsmM', fsmMSchema);



var connect = function() {
    mongoose.connect(config.settings.MONGO_URL);

    mongoose.connection.on('error', function() {
        console.log('Mongoose error: ' + config.settings.MONGO_URL);
    });

    mongoose.connection.on('connecting', function() {
        console.log('Mongoose connecting: ' + config.settings.MONGO_URL);
    });

    mongoose.connection.on('connected', function() {
        console.log('Mongoose connected: ' + config.settings.MONGO_URL);
    });

    mongoose.connection.on('open', function() {
        console.log('Mongoose open: ' + config.settings.MONGO_URL);
    });

    mongoose.connection.on('disconnecting', function() {
        console.log('Mongoose disconnecting: ' + config.settings.MONGO_URL);
    });

    mongoose.connection.on('disconnected', function() {
        console.log('Mongoose disconnected: ' + config.settings.MONGO_URL);
    });

    mongoose.connection.on('close', function() {
        console.log('Mongoose close: ' + config.settings.MONGO_URL);
    });

    mongoose.connection.on('reconnected', function() {
        console.log('Mongoose reconnected: ' + config.settings.MONGO_URL);
    });

    mongoose.connection.on('fullsetup', function() {
        console.log('Mongoose fullsetup: ' + config.settings.MONGO_URL);
    });
};

connect();
