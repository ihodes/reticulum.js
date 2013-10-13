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
    publicFields: {_id: U._idToId, fsm: null,
                   name: null, description: null},

    createParams: {fsm: [true, fsmValidator], name: true,
                   description: false, user: false},
    updateParams: {fsm: [false, fsmValidator], name: false,
                   description: false, user: false}
};
var cleaner = loch.allower(API.publicFields);
var createValidator = _.partial(loch.validates, API.createParams);
var updateValidator = _.partial(loch.validates, API.updateParams);


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
    var errors = updateValidator(req.body);
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
