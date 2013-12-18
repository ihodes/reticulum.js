var vows      = require('vows'),
    assert    = require('assert'),
    should    = require('should'),
    logger    = require('../lib/logger').logger,
    reticulum = require('../lib/reticulum');



var USER_CONTEXT = {};

var testfsm = {
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
              enter: [ [['set', 'nestedKey.cool', 'supercoolval']] ]
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




vows.describe('Operating with a FSM').addBatch({
    'when reifying a FSM': {
        topic: function() {
            return reticulum.reify(testfsm);
        },

        'a FSM instance should be returned': function(topic) {
            should.exist(topic);

            topic.should.be.an.instanceOf(Object);
            topic.should.have.keys('fsm', 'currentStateName', 'locals', 'lastEvent');
            topic.currentStateName.should.be.a.String;
            topic.locals.should.be.an.instanceOf(Object);
            topic.lastEvent.should.be.an.instanceOf(Object);

            topic.currentStateName.should.equal('SubstateA1');
         }
     },

     'when sending an event that should transition': {
         topic: function() {
             var fsmi =  reticulum.reify(testfsm);
             reticulum.send(fsmi, USER_CONTEXT, {name: 'gotoA2'}, this.callback);
         },

         'a new FSM instance should be returned with the new state': function(fsmi, response) {
            should.exist(fsmi);

            fsmi.should.be.an.instanceOf(Object);
            fsmi.should.have.keys('fsm', 'currentStateName', 'locals', 'lastEvent');
            fsmi.currentStateName.should.be.a.String;
            fsmi.locals.should.be.an.instanceOf(Object);
            fsmi.lastEvent.should.be.an.instanceOf(Object);

            // testing transition
            fsmi.currentStateName.should.equal('SubstateA2');
        }
    },

    'when sending an event that has an enter event, and transitions': {
        topic: function() {
            var fsmi =  reticulum.reify(testfsm);
            reticulum.send(fsmi, USER_CONTEXT, {name:'gotoSubA3'}, this.callback);
        },

        'a FSM instance should be returned with the new state and updated global': function(fsmi, response) {
            should.exist(fsmi);

            fsmi.should.be.an.instanceOf(Object);
            fsmi.should.have.keys('fsm', 'currentStateName', 'locals', 'lastEvent');
            fsmi.currentStateName.should.be.a.String;
            fsmi.locals.should.be.an.instanceOf(Object);
            fsmi.lastEvent.should.be.an.instanceOf(Object);

            // testing nested transition
            fsmi.currentStateName.should.equal('SubsubstateA31');

            // testing locals (setting)
            fsmi.locals.should.have.keys('magicVar');
            fsmi.locals.magicVar.should.eql('testSet');
        }
    },

    'when transitioning into a state that sets a nested local key': {
        topic: function() {
            var fsmi =  reticulum.reify(testfsm);
            reticulum.send(fsmi, USER_CONTEXT, {name: 'gotoA2'}, this.callback);
        },

        'a FSM instance should be returned with the correct locals': function(fsmi, response) {
            should.exist(fsmi);

            fsmi.should.be.an.instanceOf(Object);
            fsmi.should.have.keys('fsm', 'currentStateName', 'locals', 'lastEvent');
            fsmi.currentStateName.should.be.a.String;
            fsmi.locals.should.be.an.instanceOf(Object);
            fsmi.lastEvent.should.be.an.instanceOf(Object);

            // testing locals (setting)
            fsmi.locals.should.have.keys('nestedKey');
            fsmi.locals.nestedKey.should.have.keys('cool');
            fsmi.locals.nestedKey.cool.should.eql('supercoolval');
        }
    },

    'when transitioning into a state that clears a key': {
        topic: function() {
            var fsmi =  reticulum.reify(testfsm);
            var cb = this.callback;
            reticulum.send(fsmi, USER_CONTEXT, {name: 'gotoSubA3'}, function(fsmi, response) {
                reticulum.send(fsmi, USER_CONTEXT, {name: 'goDeep!'}, cb);
            });
        },

        'the associated value should not exist': function(fsmi, response) {
            should.exist(fsmi);

            fsmi.should.be.an.instanceOf(Object);
            fsmi.should.have.keys('fsm', 'currentStateName', 'locals', 'lastEvent');
            fsmi.currentStateName.should.be.a.String;
            fsmi.locals.should.be.an.instanceOf(Object);
            fsmi.lastEvent.should.be.an.instanceOf(Object);

            // testing locals (setting)
            should.strictEqual(undefined, fsmi.locals.magicVar);
        }
    },

    'when transitioning a few times': {
        topic: function() {
            var fsmi =  reticulum.reify(testfsm);
            var cb = this.callback;
            reticulum.send(fsmi, USER_CONTEXT, {name:'gotoA2'}, function(fsmi, response) {
                reticulum.send(fsmi, USER_CONTEXT, {name:'gotoA1'}, function(fsmi, response){
                    reticulum.send(fsmi, USER_CONTEXT, {name:'gotoSubA3'}, cb); 
                });
            });
        },

        'should be in the correct state': function(fsmi, response) {
            should.exist(fsmi);

            fsmi.should.be.an.instanceOf(Object);
            fsmi.should.have.keys('fsm', 'currentStateName', 'locals', 'lastEvent');
            fsmi.currentStateName.should.be.a.String;
            fsmi.locals.should.be.an.instanceOf(Object);
            fsmi.lastEvent.should.be.an.instanceOf(Object);

            fsmi.currentStateName.should.equal('SubsubstateA31');
        }
    },

    'when making an external request': {
        topic: function() {
            var fsmi =  reticulum.reify(testfsm);
            reticulum.send(fsmi, USER_CONTEXT, {name:'gotoA4'}, this.callback);
        },

        'the response should be stored': function(fsmi, response) {
            should.exist(fsmi);

            fsmi.should.be.an.instanceOf(Object);
            fsmi.should.have.keys('fsm', 'currentStateName', 'locals', 'lastEvent');
            fsmi.currentStateName.should.be.a.String;
            fsmi.locals.should.be.an.instanceOf(Object);
            fsmi.lastEvent.should.be.an.instanceOf(Object);

            fsmi.locals.should.have.keys('avar');
            fsmi.locals.avar.url.should.equal('http://httpbin.org/get');
        }
    }
}).export(module);
