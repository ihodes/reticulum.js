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
    app.namespace('/fsm', function() {
        app.post('/reify', function(req, res) { 
            // for now, just return the reified fsm
            var fsmM = r.reify(fsm, 'stateA');
            fsmDb.push(fsmM);
            res.send({success: true, fsmM: fsmM, id: fsmDb.length-1});
        });
        app.get('/:fsmid', function(req, res) { 
            var id   = parseInt(req.params.fsmid),
                fsmM = fsmDb[id];
            if (fsmM)
                res.send({fsmM: fsmM, id: id});
            else
                res.status(404).send({error: 404})
        });
        app.post('/:fsmid/send/:event', function(req, res) { 
            var id    = parseInt(req.params.fsmid),
                event = req.params.event,
                args  = req.body.args,
                fsmM  = fsmDb[id];

            var fsmM1 = r.send(fsmM, event, args);
            fsmDb[id] = fsmM1;

            if (fsmM)
                res.send({msg: 'msg recieved', event: event, args: args, fsmM: fsmM1});
            else
                res.status(404).send({error: 404})
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



// db
var fsmDb = [];


// stubs
var fsm = {
    stateA: { 
        actions: {
            event: [
                function (globals, evt, args) { if(evt === 'gotoB') return 'stateB'; },
                function (globals, evt, args) { return 'stateA1'; }
            ]
        },

        substates: {

            stateA1: {
                actions: {
                    enter: [
                        function (globals, evt, args) { globals.magic = 1; }
                    ]
                }
            }

        }
    },

    stateB: {
        actions: {
            event: [
                function (globals, evt, args) { return 'stateA'; }
            ]
        }
    }
};
