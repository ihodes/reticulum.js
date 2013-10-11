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
    fsm:          {type: Object, required: true},
    name:         {type: String, required: true},
    description:  {type: String},
    user:         {type: String}, // organizational user
    group:        {type: String}  // logical application group for interstate communication
}, { minimize: false });
fsmSchema.post('save', function(doc) {
    logger.info('Saved fsm: ' + JSON.stringify(doc.toObject()));
});
exports.fsm = mongoose.model('fsm', fsmSchema);


var fsmInstanceSchema = new mongoose.Schema({
    createdAt:    {type: Date, default: Date.now},
    fsm: {type: ObjectId, ref: 'fsm', required: true},
    locals: {type: Object, required: true, default: {}},
    currentStateName: {type: String, required: true},
    lastEvent: {type: {name: String, args: Object}, required: true, default: {name: null, args: {}}}
}, { minimize: false });
fsmInstanceSchema.post('save', function(doc) {
    logger.info('Saved fsm instance: ' + JSON.stringify(doc.toObject()));
});
exports.fsmInstance = mongoose.model('fsmInstance', fsmInstanceSchema);



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
