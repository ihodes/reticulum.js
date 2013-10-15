// (C) Isaac Hodes
// Sept 2013
'use strict';

var _      = require('underscore'),
    loch   = require('loch'),
    U      = require('../lib/utils'),
    user    = require('../models/user'),
    logger = require('../lib/logger').logger;
require('underscore-contrib');


var API = {
    publicFields: { _id: U._idToId, username: null },
    createParams: { username: true },
};
var cleaner = loch.allower(API.publicFields);
var createValidator = _.partial(loch.validates, API.createParams);



exports.allUsers = function (req, res) {
    user.allUsers(req.user, req.params, U.sendBack(res, function(res) {
        return { users: _.map(res, cleaner) };
    }));
};

exports.createUser = function(req, res) {
    var errors = createValidator(req.body);
    if(_.isObject(errors))
        return U.error(res, U.ERRORS.badRequest, {errors: errors});
    user.createUser(req.user, req.body, U.sendBack(res, 201, cleaner));
};

exports.updateUser = function(req, res) {
    var errors = updateValidator(req.body);
    if(_.isObject(errors))
        return U.error(res, U.ERRORS.badRequest, {errors: errors});
    user.updateUser(req.user, req.params.userId, req.body, U.sendBack(res, cleaner));
};

exports.getUser = function(req, res) {
    user.getUser(req.user, req.params.userId, U.sendBack(res, cleaner));
};



  /////////////////////////
 //// HTML stuff hurr ////
/////////////////////////
exports.listUsers = function(req, res) {
    user.allUsers(req.user, req.params, U.sendBack(res, function(results) {
        return res.render('users/all.ejs', {users: _.map(results, cleaner)});
    }));
};
