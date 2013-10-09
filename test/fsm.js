var vows     = require('vows'),
    assert   = require('assert'),
    should   = require('should'),
    logger   = require('../lib/logger').logger;

var reticulum = require('../lib/reticulum');

var testfsm = {
    name: 'StateA',
    initialState: 'SubstateA1',
    actions: {
        event: [ [['log', 'StateA recieved this message']] ]
    },
    states: [
        { name: 'SubstateA1',
          actions: {
              event: [ [['log', 'SubstateA1 got a message']],
                       [['if', 'eq', 'gotoA2'], 'SubstateA2'],
                       [['if', 'eq', 'gotoSubA3'], 'SubsubstateA31'] ]
          },
        },
        { name: 'SubstateA2',
          actions: {
              event: [ [['if', 'eq', 'gotoA1'], 'SubstateA2'] ],
              enter: [ [['log', 'just entered SubstateA2']] ]
          },
        },
        { name: 'SubstateA3',
          actions: {
              event: [ [['log', 'SubstateA3 recieved this message']] ],
              enter: [ [['log', 'just entered SubstateA3']] ],
              exit:  [ [['log', 'just exited SubstateA3']] ]
          },
          initialState: 'SubsubstateA32',
          states: [
              { name: 'SubsubstateA31',
                actions: {
                    event: [ [['log', 'SubsubstateA31 recieved this message']],
                             [['if', 'eq', 'gotoA2'], 'SubstateA2'] ],
                    enter: [ [['set', 'magicVar', 'testSet']],
                             [['log', 'just entered SubsubstateA31']] ],
                    exit:  [ [['log', 'just exited SubsubstateA31']] ]
                }
              },
              { name: 'SubsubstateA32' }
          ]
        },
        { name: 'SubstateA4' }
    ]
};




vows.describe('Operating with a FSM').addBatch({
    'when reifying a FSM': {
        topic: function() {
            return reticulum.reify(testfsm);
        },

        'a FSM instance should be returned': function(topic) {
            should.exist(topic);

            topic.should.be.an.instanceOf(Object, undefined, 2);
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

            topic.should.be.an.instanceOf(Object, undefined, 2);
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

            topic.should.be.an.instanceOf(Object, undefined, 2);
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
    }
}).export(module);
