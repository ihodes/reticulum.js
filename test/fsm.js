var vows     = require('vows'),
    assert   = require('assert'),
    should   = require('should'),
    logger   = require('../lib/logger').logger;

var reticulum = require('../lib/reticulum');

var testfsm = {
    stateA: { 
        actions: {
            event: [
                ["ifEqTransitionTo", "gotoB", "stateB"],
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
                ["transitionTo", "stateA"]
            ]
        }
    }
};



vows.describe('Operating with a FSM').addBatch({
    'when reifying a fsm': {
        topic: function() {
            return reticulum.reify(testfsm, 'stateA');
        },

        'a fsmM should be returned': function(topic) {
            should.exist(topic);
            topic.should.be.an.instanceOf(Array);
            topic.should.includeEql(testfsm); // fsm
            topic.should.includeEql({ stateName: 'stateA', globals: {},
                                      lastEvent: [undefined, []] }); // currentState
            topic.should.includeEql([]); // history
        }
    },

    'when sending an event that should transition': {
        topic: function() {
            var fsmM1 =  reticulum.reify(testfsm, 'stateA');
            fsmM2 = reticulum.send(fsmM1, 'gotoB');
            return fsmM2;
        },

        'a new fsmM should be returned with the new state': function(topic) {
            should.exist(topic);
            topic.should.be.an.instanceOf(Array);
            topic.should.includeEql(testfsm); // fsm
            topic.should.includeEql({ stateName: 'stateB', globals: {},
                                      lastEvent: ['gotoB', []] }); // currentState
            topic.should.includeEql([{ stateName: 'stateA', globals: {},
                                       lastEvent: [undefined, []] }]); // history
        }
    },

    'when sending an event that has exit event, and transitions': {
        topic: function() {
            var fsmM1 =  reticulum.reify(testfsm, 'stateA');
            fsmM2 = reticulum.send(fsmM1, 'a1go');
            return fsmM2;
        },

        'a new fsmM should be returned with the new state and updated global': function(topic) {
            topic.should.be.an.instanceOf(Array);
            topic.should.includeEql(testfsm); // fsm
            topic.should.includeEql({ stateName: 'stateA1', globals: {magic: 0},
                                      lastEvent: ['a1go', []] }); // currentState
            topic.should.includeEql([{ stateName: 'stateA', globals: {magic: 0},
                                       lastEvent: [undefined, []] }]); // history
            should.exist(topic);
        }
    }
}).export(module);
