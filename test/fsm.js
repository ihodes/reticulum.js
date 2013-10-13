var vows      = require('vows'),
    assert    = require('assert'),
    should    = require('should'),
    logger    = require('../lib/logger').logger,
    reticulum = require('../lib/reticulum');

var testfsm = {
    name: 'StateA',
    initialStateName: 'SubstateA1',
    states: [
        { name: 'SubstateA1',
          actions: {
              event: [ [['if', 'eq', 'gotoA2'], 'SubstateA2'],
                       [['if', 'eq', 'gotoSubA3'], 'SubsubstateA31'],
                       [['if', 'eq', 'gotoA4'], 'SubstateA4'] ]
          },
        },
        { name: 'SubstateA2',
          actions: {
              event: [ [['if', 'eq', 'gotoA1'], 'SubstateA1'] ],
              enter: [ [['set', 'nestedKey.cool', 'supercoolval']] ]
          },
        },
        { name: 'SubstateA3',
          initialStateName: 'SubsubstateA32',
          states: [
              { name: 'SubsubstateA31',
                actions: {
                    event: [ [['if', 'eq', 'gotoA2'], 'SubstateA2'],
                             [['if', 'eq', 'goDeep!'], 'SubsubstateA32'] ],
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
              enter: [ [['request', 'GET', 'http://httpbin.org/get', '', 'avar']] ]
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
             fsmi = reticulum.send(fsmi, 'gotoA2');
             return fsmi;
         },

         'a new FSM instance should be returned with the new state': function(topic) {
            should.exist(topic);

            topic.should.be.an.instanceOf(Object);
            topic.should.have.keys('fsm', 'currentStateName', 'locals', 'lastEvent');
            topic.currentStateName.should.be.a.String;
            topic.locals.should.be.an.instanceOf(Object);
            topic.lastEvent.should.be.an.instanceOf(Object);

            // testing transition
            topic.currentStateName.should.equal('SubstateA2');
        }
    },

    'when sending an event that has an enter event, and transitions': {
        topic: function() {
            var fsmi =  reticulum.reify(testfsm);
            fsmi = reticulum.send(fsmi, 'gotoSubA3');
            return fsmi;
        },

        'a FSM instance should be returned with the new state and updated global': function(topic) {
            should.exist(topic);

            topic.should.be.an.instanceOf(Object);
            topic.should.have.keys('fsm', 'currentStateName', 'locals', 'lastEvent');
            topic.currentStateName.should.be.a.String;
            topic.locals.should.be.an.instanceOf(Object);
            topic.lastEvent.should.be.an.instanceOf(Object);

            // testing nested transition
            topic.currentStateName.should.equal('SubsubstateA31');

            // testing locals (setting)
            topic.locals.should.have.keys('magicVar');
            topic.locals.magicVar.should.eql('testSet');
        }
    },

    'when transitioning into a state that sets a nested local key': {
        topic: function() {
            var fsmi =  reticulum.reify(testfsm);
            fsmi = reticulum.send(fsmi, 'gotoA2');
            return fsmi;
        },

        'a FSM instance should be returned with the correct locals': function(topic) {
            should.exist(topic);

            topic.should.be.an.instanceOf(Object);
            topic.should.have.keys('fsm', 'currentStateName', 'locals', 'lastEvent');
            topic.currentStateName.should.be.a.String;
            topic.locals.should.be.an.instanceOf(Object);
            topic.lastEvent.should.be.an.instanceOf(Object);

            // testing locals (setting)
            topic.locals.should.have.keys('nestedKey');
            topic.locals.nestedKey.should.have.keys('cool');
            topic.locals.nestedKey.cool.should.eql('supercoolval');
        }
    },

    'when transitioning into a state that clears a key': {
        topic: function() {
            var fsmi =  reticulum.reify(testfsm);
            fsmi = reticulum.send(fsmi, 'gotoSubA3');
            fsmi = reticulum.send(fsmi, 'goDeep!');
            return fsmi;
        },

        'the associated value should now be undefined': function(topic) {
            should.exist(topic);

            topic.should.be.an.instanceOf(Object);
            topic.should.have.keys('fsm', 'currentStateName', 'locals', 'lastEvent');
            topic.currentStateName.should.be.a.String;
            topic.locals.should.be.an.instanceOf(Object);
            topic.lastEvent.should.be.an.instanceOf(Object);

            // testing locals (setting)
            topic.locals.should.have.keys('magicVar');
            should.strictEqual(undefined, topic.locals.magicVar);
        }
    },

    'when transitioning a few times': {
        topic: function() {
            var fsmi =  reticulum.reify(testfsm);
            fsmi = reticulum.send(fsmi, 'gotoA2');
            fsmi = reticulum.send(fsmi, 'gotoA1');
            fsmi = reticulum.send(fsmi, 'gotoSubA3');
            return fsmi;
        },

        'should be in the correct state': function(topic) {
            should.exist(topic);

            topic.should.be.an.instanceOf(Object);
            topic.should.have.keys('fsm', 'currentStateName', 'locals', 'lastEvent');
            topic.currentStateName.should.be.a.String;
            topic.locals.should.be.an.instanceOf(Object);
            topic.lastEvent.should.be.an.instanceOf(Object);

            topic.currentStateName.should.equal('SubsubstateA31');
        }
    },

    'when making an external request': {
        topic: function() {
            var fsmi =  reticulum.reify(testfsm);
            fsmi = reticulum.send(fsmi, 'gotoA4');
            return fsmi;
        },

        'the response should be stored': function(topic) {
            should.exist(topic);

            topic.should.be.an.instanceOf(Object);
            topic.should.have.keys('fsm', 'currentStateName', 'locals', 'lastEvent');
            topic.currentStateName.should.be.a.String;
            topic.locals.should.be.an.instanceOf(Object);
            topic.lastEvent.should.be.an.instanceOf(Object);

            topic.locals.should.have.keys('avar');
            topic.locals.avar.url.should.equal('http://httpbin.org/get');
        }
    }
}).export(module);
