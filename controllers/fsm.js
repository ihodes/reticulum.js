// (C) Isaac Hodes
// Sept 2013
'use strict';

var _      = require('underscore'),
    loch   = require('loch'),
    U      = require('../lib/utils'),
    fsm    = require('../models/fsm'),
    fsmValidator = require('../lib/validate-fsm').fsmValidator,
    logger = require('../lib/logger').logger;
require('underscore-contrib');


var API = {
    publicFields: {_id: U._idToId, fsm: null, name: null, description: null},

    createParams: {fsm: [true, fsmValidator], name: true,
                   description: false, user: false},
    updateParams: {fsm: [false, fsmValidator], name: false,
                   description: false, user: false},

    formCreateParams: {name: true, description: false},
};
var cleaner = loch.allower(API.publicFields);
var createValidator = _.partial(loch.validates, API.createParams);
var formCreateValidator = _.partial(loch.validates, API.formCreateParams);
var updateValidator = _.partial(loch.validates, API.updateParams);


exports.allFsms = function (req, res) {
    fsm.allFsms(req.user, req.params, U.sendBack(res, function(res) {
        return { fsms: _.map(res, cleaner) };
    }));
};

exports.createFsm = function(req, res) {
    var errors = createValidator(req.body);
    if(_.isObject(errors))
        return U.error(res, U.ERRORS.badRequest, {errors: errors});
    fsm.createFsm(req.user, req.body, U.sendBack(res, 201, cleaner));
};

exports.formCreateFsm = function(req, res) {
    var errors = formCreateValidator(req.body);
    if(_.isObject(errors))
        return U.error(res, U.ERRORS.badRequest, {errors: errors});
    fsm.createFsm(req.user, {fsm: {name: "Root"},
                             name: req.body.name,
                             description: req.body.description || "" }, 
                 function(){ res.redirect("/v1/fsm/all") });
};

exports.updateFsm = function(req, res) {
    var errors = updateValidator(req.body);
    console.log(JSON.stringify(errors)); // TK TODO REMOVE
    // TK PICKUP error (not here) with not resetting superstate's initial substate name if a initial state is removed. Should set it to blank/none, or give some feedback to user before they save? Or when trying to save, for now, just display the validator error in the GUI? Hacky but powerful for now. Need to also fix changing the initial state name... somehow it isn't saving once the initial state itself has already been removed.
    if(_.isObject(errors))
        return U.error(res, U.ERRORS.badRequest, {errors: errors});
    fsm.updateFsm(req.user, req.params.fsmId, req.body, U.sendBack(res, cleaner));
};

exports.getFsm = function(req, res) {
    fsm.getFsm(req.user, req.params.fsmId, U.sendBack(res, cleaner));
};



  /////////////////////////
 //// HTML stuff hurr ////
/////////////////////////

exports.listFsms = function(req, res) {
    fsm.allFsms(req.user, req.params, U.sendBack(res, function(results) {
        return res.render('fsm/all.ejs', { fsms: _.map(results, cleaner) });
    }, true));
};

// TK INSECURE not secure (need to ensure that the fsm belongs to the user)
exports.showFsm = function(req, res) {
    res.render('fsm/show.ejs', {id: req.params.fsmId, fsmInstanceId: ''});
};


// TK INSECURE not secure
exports.buildFsm = function(req, res) {
    res.render('fsm/build.ejs');
};
