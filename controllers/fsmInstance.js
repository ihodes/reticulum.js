// (C) Isaac Hodes
// Sept 2013
'use strict';

var _           = require('underscore'),
    loch        = require('loch'),
    U           = require('../lib/utils'),
    fsmInstance = require('../models/fsmInstance'),
    logger      = require('../lib/logger').logger;


var API = {
    publicFields: { _id: U._idToId, currentStateName: null, fsm: null, lastEvent: null, locals: null }
};
var cleaner = loch.allower(API.publicFields);


exports.allFsmInstances = function (req, res) {
    fsmInstance.allFsmInstances(req.params, U.sendBack(res, function(res) {
        return { fsmInstances: _.map(res, cleaner) };
    }));
};

exports.reifyFsm = function(req, res) {
    fsmInstance.reifyFsm(req.params.fsmId, req.body, U.sendBack(res, 201, cleaner));
};

exports.getFsmInstance = function(req, res) {
    fsmInstance.getFsmInstance(req.params.fsmInstanceId, req.body, U.sendBack(res, cleaner));
};

exports.sendEvent = function(req, res) {
    fsmInstance.sendEvent(req.params.fsmInstanceId, req.params.fsmId, req.params.event,
                   req.body, U.sendBack(res, cleaner));
};



  /////////////////////////
 //// HTML stuff hurr ////
/////////////////////////

exports.showFsmInstance = function(req, res) {
    res.render('show.html', {id: req.params.fsmId, fsmInstanceId: req.params.fsmInstanceId});
};
