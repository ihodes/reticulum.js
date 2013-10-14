'use strict';

var _            = require('underscore'),
    express      = require('express'),
    r            = require('./lib/reticulum'),
    config       = require('./config'),
    logging      = require('./lib/logger'),
    logger       = logging.logger,
    fsm          = require('./controllers/fsm'),
    fsmInstance  = require('./controllers/fsmInstance');
require('express-namespace');
require('underscore-contrib');


logger.info('------STARTING APPLICATION------');

// Setup, Middleware
var app = express();
app.use(express.bodyParser());
app.use(logging.requestLogger);
app.use(express.errorHandler());
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/templates');
app.use(express.static(__dirname + '/resources'));



// Routes
app.all('/v1', function(req, res) {
    res.send({message: "You are connected to the API", status: 200});
});

app.namespace('/v1', function() {
    app.namespace('/fsm', function() {
        app.get('/', fsm.allFsms);
        app.post('/', fsm.createFsm);

        app.get('/all', fsm.listFsms); // html/js

        app.namespace('/:fsmId', function() {
            app.put('/', fsm.updateFsm);
            app.get('/', fsm.getFsm);

            app.get('/show', fsm.showFsm); // html/js

            app.post('/reify', fsmInstance.reifyFsm);
            app.get('/:fsmInstanceId', fsmInstance.getFsmInstance);
            app.post('/:fsmInstanceId/send/:event', fsmInstance.sendEvent);

            app.get('/:fsmInstanceId/show', fsmInstance.showFsmInstance); // html/js
        });
    })
});

app.all('*', function (req, res) {
    res.status(404).send({error: "Not Found", message: "Method does not exist.", status: 404});
});



// App server setup
app.listen(config.settings.PORT, function () {
    logger.info("(started, listening on port " + config.settings.PORT + ")");
});
