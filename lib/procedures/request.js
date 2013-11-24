/* jslint node: true */
'use strict';


var _ = require('underscore'),
    H = require('./helpers'),
    request = require('request');


// Requests a webpage, setting the response to the designated key, if one is given,
// in the local context.
//
// - Examples:
//
// ["request", "GET", <url>]
// ["request", "POST", <url>, <key>]
// ["request", {"url": <url>, "method": <method>, 
//              "auth": {"user": <username>, "pass": <password>},
//              "body": <JSON>,
//              "headers": {<field>: <value>}}, 
//             <key>]
//
function requestFn(params, context, response, next) {
    var method, url, key, headers, body, map, auth;
    if (_.isString(params[0])) {
        method = params[0];
        url    = params[1];
        key    = params[2];
    } else {
        map    = H.reifyObject(context, params[0]);

        method  = map.method;
        url     = map.url;
        body    = map.body;
        headers = map.headers;
        auth    = map.auth;
        key     = params[1];
    }
    if (!method) throw new Error("Request method required");
    if (!url) throw new Error("Request URL required");

    var req = {url: url, method: method};
    if (headers) req.headers = headers;
    if (auth)    req.auth    = auth;
    if (body)    req.json    = body;

    request(req, function(err, r, resp) {
        if (key) {
            var keyPath = key.split('.');
            H.setIn(context.local, keyPath, resp);
        }
        
        next(context, response, true);
    });
}


exports.functions = {
    'request': requestFn
};
