var _ = require('underscore');
var logger = require('./logger').logger;
var utils = require('./utils');
require('underscore-contrib');


  ///////////////////////
 /////// Actions   /////
///////////////////////

// This is global for now... will be integrated into FSMs somehow, later. Or may be integrated into user objects... so users can use any actions they specify, anywhere. Or both. And public actions. SO MUCH AWESOMENESS EVERYWHERE.
var ACTIONS = {
    'log': function() {
        return function(globals, evt, args) {
            logger.info("logged event: " + evt, args);
        };
    },
    'transitionTo': function(nextState) {
        return function(globals, evt, args) {
            return nextState;
        };
    },
    'ifEqTransitionTo': function(eqEvt, nextState) {
        return function(globals, evt, args) {
            if (evt === eqEvt) return nextState;
        };
    },
    'incGlobal': function(globalKey) {
        return function(globals, evt, args) {
            if (globals[globalKey]) globals[globalKey] = globals[globalKey] + 1;
            else globals[globalKey] = 0;
        };
    },
    'decGlobal': function(globalKey) {
        return function(globals, evt, args) {
            if (globals[globalKey]) globals[globalKey] = globals[globalKey] - 1;
            else globals[globalKey] = 0;
        };
    },
    'setGlobal': function(globalKey, globalVal) {
        return function(globals, evt, args) {
            globals[globalKey] = globalVal;
        };
    }
};
var getActionMaker = function(actionName) {
    return ACTIONS[actionName];
};



   ////////////////////////////////////////////////////////////
  /////  FSM Monad API  //////////////////////////////////////
 ///  Operates on a fsmM, a reification of a FSM object.  ///
////////////////////////////////////////////////////////////

// Returns the fsm from the fsmM monad.
var fsm = exports.fsm = function(fsmM) {
    return fsmM[0];
};

// Returns the current state from the fsmM monad.
var state = exports.state = function(fsmM) {
    return fsmM[1];
};

// Returns the state history from the fsmM monad.
var history = exports.history = function(fsmM) {
    return fsmM[2];
};

var appendToHistory = function(fsmM, stateName, globals, eventName, args) {
    history(fsmM).push([stateName, globals, [eventName, args]]);
};

var getStateAt = function(fsmM, stateName) {
    var finder = function(states, stateName) {
        return _.reduce(states, function(res, state, name) {
            if (name === stateName)
                return state;
            else if (_.exists(state.substates))
                return finder(state.substates, stateName);
            else
                return res;
        }, null);
    };
    return finder(fsm(fsmM), stateName);
};

var stateExists = function(fsmM, stateName) {
    return _.exists(getStateAt(fsmM, stateName));
};

var getCurrentState = function(fsmM) {
    return getStateAt(fsmM, state(fsmM).stateName);
};

var getAttributeOfState = function(stateName, attribute) {
    return function(fsmM) {
        return getStateAt(fsmM, stateName)[attribute];
    };
};

var getAttributeOfCurrentState = function(attribute) {
    return function(fsmM) {
        return getCurrentState(fsmM)[attribute];
    };
};

// Return the actions of the current state
var currentStateActions = getAttributeOfCurrentState('actions');

var getActions = function(fsmM, stateName, actionType) {
    var actions = getAttributeOfState(stateName, 'actions')(fsmM);
    if (actions) return actions[actionType];
};


// @param{actions} is [actionName, actionMakerArg1, ..., actionMakerArgn].
//
// Reifies those to actual action fns -- in essence partially applies
// those args to the function referenced by actionName.
//
// See ACTIONS at the top of this module.
var reifyActions = function(actions) {
    return _.map(actions, function(actionSpec) {
        var args   = _.rest(actionSpec),
            action = getActionMaker(_.first(actionSpec)).apply(null, args);
        return action;
    });
};

var executeActions = function(actions, evt, args, globals, shortCircuitOnValue) {
    var res, action;
    for (var idx in actions) {
        action = actions[idx];
        if (action) res = action(globals, evt, args);

        if (shortCircuitOnValue && res) return res;
    };
};



      //////////////////
     /// Public API ///
    //////////////////


// Reifies a FSM, returning a fsmM object which holds current and past state.
var reify = exports.reify = function(fsm, initialStateName, globals) {
    if (!_.exists(initialStateName)) throw new Error("Must supply initial state name");
    if (_.falsey(globals))
        globals = {};
    var currentState = {stateName: initialStateName,
                        globals: globals,
                        lastEvent: [undefined, [/* args */]]};
    var history = [];
    return [fsm, currentState, history];
};


// Sends an event and its args to the fsm, returns updated fsmM.
var send = exports.send = function(fsmM, evt, args) {
    var globals      = utils.deepCloneJSON(state(fsmM).globals),
        stateName    = state(fsmM).stateName,
        actions      = currentStateActions(fsmM),
        eventActions = getActions(fsmM, stateName, 'event'),
        result, newfsm, newCurrentState, newHistory;
    if (!_.isArray(args)) args = [];

    // See if we're supposed to transition somewhere...
    result = executeActions(reifyActions(eventActions), evt, args, globals, true);

    // TK TODO: Execute exit and enter actions as we transition in and out
    //          of superStates to or from a a nested subState. For now, we
    //          only execute the actions of the source and destination states:


    // If an action has returned a result, transition to it and execute actions:
    if (_.exists(result) && stateExists(fsmM, result)) {
        stateName = result;
        var exitActions = getActions(fsmM, state(fsmM).stateName, 'exit');
        var enterActions = getActions(fsmM, stateName, 'enter');
        executeActions(reifyActions(exitActions), evt, args, globals);
        executeActions(reifyActions(enterActions), evt, args, globals);
    }

    newfsm          = fsm(fsmM);
    newCurrentState = {stateName: stateName,
                       globals: globals,
                       lastEvent: [evt, args]};
    newhistory      = _.cons(state(fsmM), history(fsmM));

    return [newfsm, newCurrentState, newhistory];
};
