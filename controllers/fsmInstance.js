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
    publicFields: { _id: U._idToId, currentStateName: null, fsm: null,
                    lastEvent: null, locals: null, auth: null }
};
var cleaner = loch.allower(API.publicFields);
var reifyValidator = _.partial(loch.validates, API.reifyParams);
var eventValidator = _.partial(loch.validates, API.eventParams);


exports.allFsmInstances = function(req, res) {
    var query = { user: req.user };
    fsmInstance.allFsmInstances(query, U.sendBack(res, function(res) {
        return { fsmInstances: _.map(res, cleaner) };
    }));
};

exports.reifyFsm = function(req, res) {
    var query = { user: req.user, _id: req.params.fsmId };

    var errors = reifyValidator(req.body);
    if(_.isObject(errors))
        return U.error(res, U.ERRORS.badRequest, {errors: errors});

    fsmInstance.reifyFsm(query, req.body.locals, U.sendBack(res, 201, cleaner));
};

exports.getFsmInstance = function(req, res) {
    // this we we can authenticate with just the fsminstance information
    var query = { _id: req.params.fsmInstanceId, user: req.user };
    if (req.fsmInstance) {
        // TK TODO: wtf. even though in auth, we call toObject, we're still
        //          getting the crappy internal mongo BSONy object. So we do this
        //          shit so we can get the fsm's id out.
        req.fsmInstance = JSON.parse(JSON.stringify(req.fsmInstance));
        if (req.fsmInstance._id !== query._id)
            return U.error(res, U.ERRORS.notFound);
        else
            delete query['user'];
    }

    fsmInstance.getFsmInstance(query, req.body, U.sendBack(res, cleaner));
};

exports.sendEvent = function(req, res) {
    // this we we can authenticate with just the fsminstance information
    var query = { _id: req.params.fsmInstanceId, user: req.user };
    if (req.fsmInstance) {
        if (req.fsmInstance._id !== query._id)
            return U.error(res, U.ERRORS.notFound);
        else
            delete query['user'];
    }

    var errors = eventValidator(req.body);
    if(_.isObject(errors))
        return U.error(res, U.ERRORS.badRequest, {errors: errors});

    fsmInstance.sendEvent(query, req.params.event, req.body.args, res,
                          U.sendBack(res, cleaner));
};



  /////////////////////////
 //// HTML stuff hurr ////
/////////////////////////

// TK INSECURE not secure (need to ensure that the fsm belongs to the user)
exports.showFsmInstance = function(req, res) {
    res.render('fsm/show.ejs', {id: req.params.fsmId, fsmInstanceId: req.params.fsmInstanceId});
};
