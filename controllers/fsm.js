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
    publicFields: {_id: U._idToId, fsm: null,
                   name: null, group: null,
                   description: null},

    // TK TODO need to do actual FSM validation. (see lib/fsmValidator for stubbed work iah@10/9/13)
    createParams: {fsm: [true, _.always(true)], name: true,
                   description: false, user: false, group: false}
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

exports.updateFsm = function(req, res) {
    var errors = createValidator(req.body);
    if(_.isObject(errors))
        return U.error(res, U.ERRORS.badRequest, {errors: errors});
    fsm.updateFsm(req.params.fsmId, req.body, U.sendBack(res, cleaner));
};

exports.getFsm = function(req, res) {
    fsm.getFsm(req.params.fsmId, U.sendBack(res, cleaner));
};



  /////////////////////////
 //// HTML stuff hurr ////
/////////////////////////
exports.listFsms = function(req, res) {
    fsm.allFsms(req.params, U.sendBack(res, function(results) {
        return res.render('all.html', {fsms: _.map(results, cleaner)});
    }));
};

exports.showFsm = function(req, res) {
    res.render('show.html', {id: req.params.fsmId, fsmInstanceId: ''});
};
