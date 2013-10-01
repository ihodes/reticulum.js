'use strict';

var _            = require('underscore'),
    express      = require('express'),
    r            = require('./lib/reticulum'),
    config       = require('./config'),
    logging      = require('./lib/logger');
require('express-namespace');
require('underscore-contrib');
var logger = logging.logger;


// App init
logger.info('Starting application...');

var app = express();
app.use(express.bodyParser());
app.use(logging.requestLogger);


// Routing
app.all('/v1', function(req, res) {
    res.send({message: "You are connected to the API", status: 200});
});

app.namespace('/v1', function() {
    app.get('/test', function(req, res) { res.send({hey:"world"})});
});

app.all('*', function (req, res) {
    res.status(404).send({error: "Not Found", status: 404});
});

// App server setup
app.listen(config.settings.PORT, function () {
    logger.info("Listening on port " + config.settings.PORT);
});

