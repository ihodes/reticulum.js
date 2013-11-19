'use strict';

var _             = require('underscore'),
    express       = require('express'),
    r             = require('./lib/reticulum'),
    config        = require('./config'),
    logging       = require('./lib/logger'),
    logger        = logging.logger,
    user          = require('./controllers/user'),
    db            = require('./models/db'),
    fsms          = require('./controllers/fsm'),
    fsmInstances  = require('./controllers/fsmInstance'),
    authBy        = require('./lib/auth').authBy,
    instanceAuth  = require('./models/fsmInstance').authenticator,
    userAuth      = require('./models/user').authenticator;
require('express-namespace');
require('underscore-contrib');

var authMap = { '':       { cb: userAuth, name: 'user' },
                instance: { cb: instanceAuth, name: 'fsmInstance' } };



  /////////////////
 //  Middleware //
/////////////////

var app = express();
app.use(express.bodyParser());
app.use(authBy(authMap));
app.use(logging.requestLogger);
app.use(express.errorHandler()); // TK TODO disable on production
app.use(express.static(__dirname + '/resources'));
app.set('views', __dirname + '/templates');
app.engine('html', require('ejs').renderFile);



  ///////////////
 //  Routes   //
///////////////

app.namespace('/v1', function() {
    app.all('/', function(req, res) {
        res.send({message: "You are connected to the API", status: 200});
    });
    app.namespace('/fsm', function() {
        app.get('/',  fsms.allFsms);
        app.post('/', fsms.createFsm);
        app.post('/form', fsms.formCreateFsm);

        // html/js
        app.get('/all',   fsms.listFsms);
        app.get('/build', fsms.buildFsm);

        app.namespace('/:fsmId', function() {
            app.get('/',       fsms.getFsm);
            app.put('/',       fsms.updateFsm);
            app.post('/reify', fsmInstances.reifyFsm);

            // html/js
            app.get('/show',      fsms.showFsm);
            app.get('/instances', fsmInstances.getFsmInstances);

            app.namespace('/:fsmInstanceId', function() {
                app.get('/',             fsmInstances.getFsmInstance);
                app.post('/send/:event', fsmInstances.sendEvent);

                // html/js
                app.get('/show', fsmInstances.showFsmInstance);
            });
        });
    });
    app.namespace('/user', function() {
        app.get('/:userId',          user.getUser);
        app.post('/:userId/context', user.setContext);
    });
});

app.all('*', function (req, res) {
    res.status(404).send({ error: "Not Found",
                           message: "Method does not exist.",
                           status: 404 });
});


// Debug
var logRoutes = function(app) {
    _.each(['get', 'post', 'put', 'delete'], function(method) {
        _.each(app.routes[method], function (route) {
            logger.debug(method.toUpperCase() + ' ' + route['path']);
        });
    });
};



  ///////////
 // Start //
///////////

logger.warn('☁ ☁ ☁☼ ☼  STARTING APPLICATION! ⚡⚡⚡⚡⚡⚡ ');
logger.debug('------------------------------------------------------');
logger.debug("Listing routes...")
logRoutes(app);
db.connect();
logger.debug('------------------------------------------------------');
app.listen(config.settings.PORT, function() {
    logger.info("Application started, listening on port " + config.settings.PORT);
});

