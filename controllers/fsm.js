// (C) Isaac Hodes
// Sept 2013
'use strict';

var _      = require('underscore'),
    loch   = require('loch'),
    U      = require('../lib/utils'),
    fsm    = require('../models/fsm'),
    logger = require('../lib/logger').logger;
require('underscore-contrib');

var API = {
    publicFields: {_id: U._idToId, fsm: null},
    createParams: {fsm: [true, _.always(true)]} // TK TODO need to do actual FSM validation.
};
var cleaner = loch.allower(API.publicFields);
var createValidator = _.partial(loch.validates, API.createParams);


exports.allFsms = function (req, res) {
    fsm.allFsms(req.params, U.sendBack(res, function(res) {
        return { fsms: _.map(res, cleaner) };
    }));
};

exports.createFsm = function(req, res) {
    var errors = createValidator(req.body);
    if(_.isObject(errors))
        return U.error(res, U.ERRORS.badRequest, {errors: errors});
    fsm.createFsm(req.body, U.sendBack(res, 201, cleaner));
};

exports.getFsm = function(req, res) {
    fsm.getFsm(req.params.fsmId, U.sendBack(res, cleaner));
};



  /////////////////////////
 //// HTML stuff hurr ////
/////////////////////////

exports.showFsm = function(req, res) {
    res.render('show.html', {id: req.params.fsmId});
};
