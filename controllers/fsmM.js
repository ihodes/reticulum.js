// (C) Isaac Hodes
// Sept 2013
'use strict';

var _      = require('underscore'),
    loch   = require('loch'),
    U      = require('../lib/utils'),
    fsmM   = require('../models/fsmM'),
    logger = require('../lib/logger').logger;


var API = {
    publicFields: {_id: U._idToId, currentState: null, history: null, fsmId: null},
    reifyParams: {}
};
var cleaner = loch.allower(API.publicFields);
var reifyValidator = _.partial(loch.validates, API.reifyParams);


exports.allFsmMs = function (req, res) {
    fsmM.allFsmMs(req.params, U.sendBack(res, function(res) {
        return { fsmMs: _.map(res, cleaner) };
    }));
};

exports.reifyFsm = function(req, res) {
    var errors = reifyValidator(req.body);
    if(_.isObject(errors))
        return U.error(res, U.ERRORS.badRequest, {errors: errors});
    fsmM.reifyFsm(req.params.fsmId, req.body, U.sendBack(res, 201, cleaner));

};

exports.getFsmM = function(req, res) {
    fsmM.getFsmM(req.params.fsmMId, req.body, U.sendBack(res, cleaner));
};

exports.sendEvent = function(req, res) {
    fsmM.sendEvent(req.params.fsmMId, req.params.fsmId, req.params.event,
                   req.body, U.sendBack(res, cleaner));
};
