'use strict';

var _             = require('underscore'),
    express       = require('express'),
    r             = require('./lib/reticulum'),
    config        = require('./config'),
    logging       = require('./lib/logger'),
    logger        = logging.logger,
    user          = require('./controllers/user'),
    fsms          = require('./controllers/fsm'),
    fsmInstances  = require('./controllers/fsmInstance'),
    authBy        = require('./lib/auth').authBy,
    instanceAuth  = require('./models/fsmInstance').authenticator,
    userAuth      = require('./models/user').authenticator;
require('express-namespace');
require('underscore-contrib');


logger.info('------STARTING APPLICATION------');

// Setup, Middleware
var app = express();
app.use(express.bodyParser());
app.use(authBy({ '':       { cb: userAuth, name: 'user' },
                 instance: { cb: instanceAuth, name: 'fsmInstance' } }));
app.use(logging.requestLogger);
app.use(express.errorHandler()); // TK TODO disable on production
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/templates');
app.use(express.static(__dirname + '/resources'));


// Routes
app.all('/v1', function(req, res) {
    res.send({message: "You are connected to the API", status: 200});
});

app.namespace('/v1', function() {
    app.namespace('/fsm', function() {
        app.get('/', fsms.allFsms);
        app.post('/', fsms.createFsm);

        app.get('/all', fsms.listFsms); // html/js

        app.namespace('/:fsmId', function() {
            app.put('/', fsms.updateFsm);
            app.get('/', fsms.getFsm);

            app.get('/show', fsms.showFsm); // html/js

            app.post('/reify', fsmInstances.reifyFsm);
            app.get('/:fsmInstanceId', fsmInstances.getFsmInstance);
            app.post('/:fsmInstanceId/send/:event', fsmInstances.sendEvent);

            app.get('/:fsmInstanceId/show', fsmInstances.showFsmInstance); // html/js
        });
    });

    app.namespace('/user', function() {
        app.get('/:userId', user.getUser);
        app.post('/:userId/context', user.setContext);
    });
});

app.all('*', function (req, res) {
    res.status(404).send({error: "Not Found", message: "Method does not exist.", status: 404});
});



// App server setup
app.listen(config.settings.PORT, function () {
    logger.info("(started, listening on port " + config.settings.PORT + ")");
});
