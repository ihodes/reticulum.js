'use strict';

var _            = require('underscore'),
    express      = require('express'),
    r            = require('./lib/reticulum'),
    config       = require('./config'),
    logging      = require('./lib/logger');
require('express-namespace');
require('underscore-contrib');
var logger = logging.logger;

var fsm  = require('./controllers/fsm'),
    fsmM = require('./controllers/fsmM');


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
        app.put('/:fsmId', fsm.updateFsm);
        app.get('/:fsmId', fsm.getFsm);

        // html for displaying the FSM
        app.get('/:fsmId/show', fsm.showFsm);

        app.namespace('/:fsmId', function() {
            app.get('/all', fsmM.allFsmMs);
            app.post('/reify', fsmM.reifyFsm);
            app.get('/:fsmMId', fsmM.getFsmM);
            app.post('/:fsmMId/send/:event', fsmM.sendEvent);
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


var testfsm = {
    stateA: {
        actions: {
            event: [
                ["ifEqTransitionTo", "toB", "stateB"],
                ["transitionTo", "stateA1"]
            ]
        },

        substates: {

            stateA1: {
                actions: {
                    enter: [
                        ["log"],
                        ["incGlobal", "magic"]
                    ]
                }
            }

        }
    },

    stateB: {
        actions: {
            event: [
                ["log"],
                ["transitionTo", "stateA"]
            ]
        }
    }
};
