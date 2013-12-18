var vows     = require('vows'),
    assert   = require('assert'),
    should   = require('should'),
    logger   = require('../lib/logger').logger;

var fsmValidator  = require('../lib/validate-fsm').fsmValidator;


vows.describe('Validating a FSM').addBatch({
    'when validating a valid Fsm': {
        topic: function() {
            return fsmValidator(testfsm);
        },

        'true should be returned': function(topic) {
            topic.should.be.true;
         }
     },
    'when validating a FSM with an invalid transition': {
        topic: function() {
            return fsmValidator(badfsm1);
        },

        'an error should be returned': function(topic) {
            topic.should.be.a.String;
            topic.states.states.actions.event.should.eql("event must not have a transition to a state which does not exist (SubstateA2BADNO)");
         }
     }
}).export(module);


var testfsm = {
    name: 'StateA',
    initialStateName: 'SubstateA1',
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
          initialStateName: 'SubsubstateA32',
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


var badfsm1 = {
    name: 'StateA',
    initialStateName: 'SubstateA1',
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
          initialStateName: 'SubsubstateA32',
          states: [
              { name: 'SubsubstateA31',
                actions: {
                    event: [ [['log', 'SubsubstateA31 recieved this message']],
                             [['if', 'eq', 'gotoA2'], 'SubstateA2BADNO'] ],
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

