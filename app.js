'use strict';

var _            = require('underscore'),
    express      = require('express'),
    r            = require('./lib/reticulum'),
    config       = require('./config'),
    logging      = require('./lib/logger');
require('express-namespace');
require('underscore-contrib');
var logger = logging.logger;

var fsm         = require('./controllers/fsm'),
    fsmInstance = require('./controllers/fsmInstance');

// App init
logger.info('Starting application...');

var app = express();
app.use(express.bodyParser());
app.use(logging.requestLogger);
app.use(express.errorHandler());
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/templates');
app.use(express.static(__dirname + '/resources'));

// Routing
app.all('/v1', function(req, res) {
    res.send({message: "You are connected to the API", status: 200});
});

app.namespace('/v1', function() {
    app.namespace('/fsm', function() {
        app.get('/', fsm.allFsms);
        app.post('/', fsm.createFsm);

        // html for displaying the FSMs
        app.get('/all', fsm.listFsms);
        app.get('/:fsmId/show', fsm.showFsm); // won't work properly with the new fsm spec

        // specific fsms
        app.put('/:fsmId', fsm.updateFsm);
        app.get('/:fsmId', fsm.getFsm);

        app.namespace('/:fsmId', function() {
            app.get('/all', fsmInstance.allFsmInstances);
            app.post('/reify', fsmInstance.reifyFsm);
            app.get('/:fsmInstanceId', fsmInstance.getFsmInstance);
            app.post('/:fsmInstanceId/send/:event', fsmInstance.sendEvent);

            // html for displaying the fsmInstance (similar to showFsm)
            app.get('/:fsmInstanceId/show', fsmInstance.showFsmInstance); // won't work properly with the new fsm spec
        });
    })
});

app.all('*', function (req, res) {
    res.status(404).send({error: "Not Found", status: 404});
});

// App server setup
app.listen(config.settings.PORT, function () {
    logger.info("Listening on port " + config.settings.PORT);
});



