var U     = require('./utils'),
    _     = require('underscore'),
    http  = require('http');



var unauthorized = function(res) {
  res.status(401);
  res.setHeader('WWW-Authenticate', 'Basic realm="Authorization Required"');
  res.send(U.ERRORS.unauthorized);
};


// takes a map of basic auth usernames to authenticating functions, uses those to 
// set the req.user
var authBy = function(callbackMap) {
    return function(req, res, next) {
        var auth = req.headers.authorization;
        if (!auth) return unauthorized(res);
        
        var parts = auth.split(' ');
        if (parts.length !== 2) return unauthorized(res);
        
        var scheme      = parts[0],
            credentials = new Buffer(parts[1], 'base64').toString(),
            index       = credentials.indexOf(':');
        
        if ('Basic' != scheme || index < 0) return unauthorized(res);
        
        var user = credentials.slice(0, index),
            pass = credentials.slice(index + 1);
        
        var callback = callbackMap[user];
        if (! callback)  return unauthorized(res);

        callback.cb(user, pass, function(err, result) {
            if (err || !result) return unauthorized(res);
            req[callback.name] = result.toObject();
            next();
        });
    }
};
exports.authBy = authBy;
