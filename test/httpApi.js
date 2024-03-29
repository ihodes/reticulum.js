var vows     = require('vows'),
    should   = require('should'),
    logger   = require('../lib/logger').logger,
    request  = require('request'),
    _        = require('underscore');


// Config
var BASE_URL = "http://localhost:5000/v1/",
    HEADERS  = { 'Content-Type': 'application/json' },
    AUTH     = { user: '', password: 'test' },
    NAME     = '__testFSM', 
    DESC     = 'this is an FSM inserted by the test suite',
    LOCALS   = { testLocals: "This is a value", another: 123123 };


var FSM_ID;
var FSM_INSTANCE_ID;
var FSM_INSTANCE_AUTH;
vows.describe('Interacting with FSMs via HTTP').addBatch({
    // POST /fsm -- create new FSM
    'when creating a new FSM': {
        topic: function() {
            var body = { fsm: FSM, name: NAME, description: DESC };
            request({
                url: BASE_URL + 'fsm',
                auth: AUTH,
                method: 'POST',
                headers: HEADERS,
                body: JSON.stringify(body)
            }, this.callback);
        },

        '201, all-good, should be returned': function(err, res, body) {
            should.exist(res);
            res.should.be.a.object;
            res.statusCode.should.eql(201);
         },

        'should return JSON content-type': function(err, res, body) {
            res.should.be.json;
         },

        'the correct name should be returned': function(err, res, body) {
            body = JSON.parse(body);
            body.name.should.eql(NAME);
            should.exist(body.id);
            // TK NOTE MUTATION
            FSM_ID = body.id;
            FSM_AUTH = body.auth;
         },

        // GET /fsm/:id -- return exact FSM
        'and then when getting our new FSM': {
            topic: function() {
                request({
                    url: BASE_URL + 'fsm/' + FSM_ID,
                    auth: AUTH,
                    method: 'GET',
                    headers: HEADERS,
                }, this.callback);
            },
            
            '200 should be returned': function(err, res, body) {
                should.exist(res);
                res.should.be.a.object;
                res.statusCode.should.eql(200);
            },
            
            'should return JSON content-type': function(err, res, body) {
                res.should.be.json;
            },
            
            'should return that exact FSM, with the right name & description': function(err, res, body) {
                body = JSON.parse(body);
                body.should.have.keys('name', 'id', 'fsm', 'description');
                body.fsm.should.eql(FSM);
                body.name.should.eql(NAME);
            },
        },

        // GET /fsm -- return all FSMs
        'and then when listing all FSMs': {
            topic: function() {
                request({
                    url: BASE_URL + 'fsm',
                    auth: AUTH,
                    method: 'GET',
                    headers: HEADERS,
                }, this.callback);
            },
            
            '200 should be returned': function(err, res, body) {
                should.exist(res);
                res.should.be.a.object;
                res.statusCode.should.eql(200);
            },
            
            'should return JSON content-type': function(err, res, body) {
                res.should.be.json;
            },
            
            'should return JSON fsms': function(err, res, body) {
                body = JSON.parse(body);
                body.should.have.keys('fsms');
            },
            
            'should include the new FSM': function(err, res, body) {
                body = JSON.parse(body);
                body.fsms.should.includeEql({ fsm: FSM, name: NAME, id: FSM_ID,
                                              description: DESC });
            },
        },
    },

}).addBatch({
    // PUT /fsm/:id -- update an existing FSM
    'when updating a FSM with a new FSM': {
        topic: function() {
            // TK NOTE: changing the global FSM here. THIS IS MADNESS. Be careful.
            FSM.name = 'NEWSTATE';
            var body = { fsm: FSM, name: NAME };
            request({
                url: BASE_URL + 'fsm/' + FSM_ID,
                auth: AUTH,
                method: 'PUT',
                headers: HEADERS,
                body: JSON.stringify(body)
            }, this.callback);
        },
        
        '200, all-good, should be returned': function(err, res, body) {
            should.exist(res);
            res.should.be.a.object;
            res.statusCode.should.eql(200);
         },

        'should return JSON content-type': function(err, res, body) {
            res.should.be.json;
         },

        'the correct new FSM should be returned': function(err, res, body) {
            body = JSON.parse(body);
            body.should.have.keys('name', 'id', 'fsm', 'description');
            body.fsm.should.eql(FSM);
         },

    }
}).addBatch({ 
    // POST /fsm/:id/reify -- reify a FSM
    'when reifying a FSM': {
        topic: function() {
            var body = LOCALS;
            body = JSON.stringify(body);
            request({
                url: BASE_URL + 'fsm/' + FSM_ID + "/reify",
                auth: AUTH,
                method: 'POST',
                headers: HEADERS,
                body: body
            }, this.callback);
        },
        
        '201, all-good, should be returned': function(err, res, body) {
            should.exist(res);
            res.should.be.a.object;
            res.statusCode.should.eql(201);
         },

        'should return JSON content-type': function(err, res, body) {
            res.should.be.json;
         },

        'a FSM instance should be returned with the correct locals and current state': function(err, res, body) {
            body = JSON.parse(body);
            body.should.have.keys('currentStateName', 'id', 'fsm', 'locals', 'lastEvent', 'auth');
            body.fsm.should.eql(FSM_ID);
            body.currentStateName.should.eql(FSM.initialStateName);
            body.locals.should.eql(LOCALS);

            // TK NOTE MUTATION
            FSM_INSTANCE_ID = body.id;
            FSM_INSTANCE_AUTH = body.auth;
         },


        // POST /fsm/:id/:instanceId/send/:eventName -- sending an event
        'and then when sending it an event': {
            topic: function() {
                var eventName = 'gotoA2';
                var body = { argz: 'does nothing' };
                body = JSON.stringify(body);
                request({
                    url: BASE_URL + 'fsm/' + FSM_ID + "/" + FSM_INSTANCE_ID + '/send/' + eventName,
                    auth: AUTH,
                    method: 'POST',
                    headers: HEADERS,
                    body: body
                }, this.callback);
            },
            
            '200 should be returned': function(err, res, body) {
                should.exist(res);
                res.should.be.a.object;
                res.statusCode.should.eql(200);
            },
            
            'should return JSON content-type': function(err, res, body) {
                res.should.be.json;
            },

            'we should be in the new state with the correctly modified locals': function(err, res, body) {
                body = JSON.parse(body);
                body.should.have.keys('currentStateName', 'id', 'fsm', 'locals', 'lastEvent', 'auth');
                body.currentStateName.should.eql('SubstateA2');
                body.locals.should.eql(_.extend(LOCALS, {'anarg': 'does nothing'}))
            }
            
        },


        'and then when getting it with the auth token': {
            topic: function() {
                request({
                    url: BASE_URL + 'fsm/' + FSM_ID + "/" + FSM_INSTANCE_ID,
                    auth: { user: 'instance', pass: FSM_INSTANCE_AUTH },
                    method: 'GET',
                    headers: HEADERS
                }, this.callback);
            },
            
            '200 should be returned': function(err, res, body) {
                should.exist(res);
                res.should.be.a.object;
                res.statusCode.should.eql(200);
            },
            
            'should return JSON content-type': function(err, res, body) {
                res.should.be.json;
            },
        }




    }
}).export(module);




var FSM = {
    name: 'StateA',
    initialStateName: 'SubstateA1',
    states: [
        { name: 'SubstateA1',
          actions: {
              event: [ [['==', '..name', 'gotoA2'], 'SubstateA2'],
                       [['==', '..name', 'gotoSubA3'], 'SubsubstateA31'],
                       [['==', '..name', 'gotoA4'], 'SubstateA4'] ]
          },
        },
        { name: 'SubstateA2',
          actions: {
              event: [ [['==', '..name', 'gotoA1'], 'SubstateA1'] ],
              enter: [ [['set', 'anarg', '..args.argz']] ]
          },
        },
        { name: 'SubstateA3',
          initialStateName: 'SubsubstateA32',
          states: [
              { name: 'SubsubstateA31',
                actions: {
                    event: [ [['==', '..name', 'gotoA2'], 'SubstateA2'],
                             [['==', '..name', 'goDeep!'], 'SubsubstateA32'] ],
                    enter: [ [['set', 'magicVar', 'testSet']] ]
                }
              },
              { name: 'SubsubstateA32',
                actions: {
                    enter: [ [['clear', 'magicVar']] ]
                }}
          ]
        },
        { name: 'SubstateA4',
          actions: {
              enter: [ [['request', 'GET', 'http://httpbin.org/get', 'avar']] ]
          }}
    ]
};
