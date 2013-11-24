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
    eventParams: { args: [false, objValidator] },
    publicFields: { _id: U._idToId, currentStateName: null, fsm: null,
                    lastEvent: null, locals: null, auth: null }
};
var cleaner        = loch.allower(API.publicFields),
    eventValidator = _.partial(loch.validates, API.eventParams);


exports.getFsmInstances = function(req, res) {
    var query = { user: req.user, fsm: req.params.fsmId };
    fsmInstance.allFsmInstances(query, U.sendBack(res, function(res) {
        return { fsmInstances: _.map(res, cleaner) };
    }));
};

exports.reifyFsm = function(req, res) {
    var query = { user: req.user, _id: req.params.fsmId };
    fsmInstance.reifyFsm(query, req.body, U.sendBack(res, 201, cleaner));
};

exports.getFsmInstance = function(req, res) {
    // this way we can authenticate with just the fsmInstance information
    var query = { _id: req.params.fsmInstanceId, user: req.user };
    if (req.fsmInstance) {
        // TK TODO: wtf. even though in lib/auth, we call toObject, we're still
        //          getting the crappy internal mongo BSONy object. So we do
        //          this shit so we can get the fsm's id out properly.
        req.fsmInstance = JSON.parse(JSON.stringify(req.fsmInstance));
                                                     // Don't want to leak that, but
                                                     // the error really is a 401
                                                     //                      \/ 
        if (req.fsmInstance._id !== query._id)  return U.error(res, U.ERRORS.notFound);
        else  delete query['user'];
    }

    fsmInstance.getFsmInstance(query, req.body, U.sendBack(res, cleaner));
};

exports.sendEvent = function(req, res) {
    // this way we can authenticate with just the fsmInstance information
    var query = { _id: req.params.fsmInstanceId, user: req.user };
    var event = { name: req.params.event, args: req.body };

    if (req.fsmInstance) {
        // TK TODO: wtf. even though in lib/auth, we call toObject, we're still
        //          getting the crappy internal mongo BSONy object. So we do
        //          this shit so we can get the fsm's id out properly.
        req.fsmInstance = JSON.parse(JSON.stringify(req.fsmInstance));

        // Really, not authorized. But don't want to leak that information.
        if (req.fsmInstance._id !== query._id)
            return U.error(res, U.ERRORS.notFound);
        else
            delete query['user'];
    }

    var errors = eventValidator(req.body);
    if(_.isObject(errors))
        return U.error(res, U.ERRORS.badRequest, {errors: errors});

    fsmInstance.sendEvent(query, event, function(err, fsmi, response) {
        if (err || !fsmi) {
            res.send({error: err}); // TK TODO proper error handling
        } else {
            if (response.status)   res.status(response.status);
            if (response.headers)  res.set(response.headers);
            res.send(response.body || cleaner(fsmi.toObject()));
        }
    });
};



  /////////////////////////
 //// HTML stuff hurr ////
/////////////////////////

// TK SECURITY
// \/ not secure (need to ensure that the fsm belongs to the user)
exports.showFsmInstance = function(req, res) {
    res.render('fsm/show.ejs', {id: req.params.fsmId,
                                fsmInstanceId: req.params.fsmInstanceId});
};
