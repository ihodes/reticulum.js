// (C) Isaac Hodes
// Sept 2013
'use strict';

var _           = require('underscore'),
    loch        = require('loch'),
    U           = require('../lib/utils'),
    fsmInstance = require('../models/fsmInstance'),
    logger      = require('../lib/logger').logger;



var objValidator = loch.validator("{{key}} must be an object", _.isObject);
var API = {
    reifyParams: { locals: [false, objValidator] },
    eventParams: { args: [false, objValidator] },
    publicFields: { _id: U._idToId, currentStateName: null, fsm: null, lastEvent: null, locals: null }
};
var cleaner = loch.allower(API.publicFields);
var reifyValidator = _.partial(loch.validates, API.reifyParams);
var eventValidator = _.partial(loch.validates, API.eventParams);


exports.allFsmInstances = function (req, res) {
    fsmInstance.allFsmInstances(req.user, req.params, U.sendBack(res, function(res) {
        return { fsmInstances: _.map(res, cleaner) };
    }));
};

exports.reifyFsm = function(req, res) {
    var errors = reifyValidator(req.body);
    if(_.isObject(errors))
        return U.error(res, U.ERRORS.badRequest, {errors: errors});
    fsmInstance.reifyFsm(req.user, req.params.fsmId, req.body.locals,
                         U.sendBack(res, 201, cleaner));
};

exports.getFsmInstance = function(req, res) {
    fsmInstance.getFsmInstance(req.user, req.params.fsmInstanceId, req.body,
                               U.sendBack(res, cleaner));
};

exports.sendEvent = function(req, res) {
    var errors = eventValidator(req.body);
    if(_.isObject(errors))
        return U.error(res, U.ERRORS.badRequest, {errors: errors});
    fsmInstance.sendEvent(req.user, req.params.fsmInstanceId, req.params.fsmId,
                          req.params.event, req.body.args, U.sendBack(res, cleaner));
};



  /////////////////////////
 //// HTML stuff hurr ////
/////////////////////////

// TK INSECURE not secure (need to ensure that the fsm belongs to the user)
exports.showFsmInstance = function(req, res) {
    res.render('fsm/show.ejs', {id: req.params.fsmId, fsmInstanceId: req.params.fsmInstanceId});
};
