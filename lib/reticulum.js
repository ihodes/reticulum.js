/* jslint node: true */
'use strict';


var _      = require('underscore'),
    logger = require('./logger').logger,
    U      = require('./utils');
require('underscore-contrib');



var PROCEDURES    = require('./procedures'),
    GLOBAL_PARAMS = require('./globals').GLOBAL_PARAMS;


   ////////////////////////////////////////////////////////////////////
  /////  FSM Instance API  ///////////////////////////////////////////
 ///  Operates on a fsm instance, a reification of a FSM object.  ///
////////////////////////////////////////////////////////////////////

/// Instance is of form:
///  { fsm: /* FSM */,
///    currentStateName: "...", locals: {...}, lastEvent: {name: "...", args: {}} }

// Returns a FSM instance
var reify = function(fsm, locals) {
    locals = locals || {};

    return {fsm: fsm, currentStateName: fsm.initialStateName || null,
            locals: locals, lastEvent: {name: null, args: {}}};
};

// Returns the FSM of the FSM instance
var getFsm = function(fsmi) {
    return fsmi.fsm;
};

// Returns the current state of the FSM instance.
var getCurrentStateName = function(fsmi) {
    return fsmi.currentStateName;
};

// Returns the last event & its args of the FSM instance.
//  { eventName: "...", args: {...} }
var lastEvent = function(fsmi) {
    return fsmi.lastEvent;
};

// Returns the local of the FSM instance.
var getLocals = function(fsmi) {
    return fsmi.locals;
};

// Return the state in a fsm found by its name.
var findStateIn = function(root, stateName) {
    return (function __letrec(currentNode) {
        if (currentNode.name == stateName) return currentNode;
        else return _.first(_.compact(_.map(currentNode.states, __letrec)));
    })(root);
};


// Returns an object with keys `exiting` and `entering` containing states
// from transitioning from `from` to `to` state names in FSM.
function transitions(fsm, from, to) {
    var transitionState = findStateIn(fsm, to);

    // If transitioning to a superstate, find initial substate of that superstate.
    while (transitionState && transitionState.initialStateName)
        transitionState = findStateIn(fsm, transitionState.initialStateName);

    if (! transitionState)
        throw new Error("State \"" + to + "\" doton't exist: cannot transition.");

    var nameIs = function(name) {return function(node) {return node.name === name;};};
    var transitionStates = pathBetween(fsm, U.getter('states'),
                                       nameIs(from), nameIs(to));

    if (! transitionState)
        throw new Error("Illegal transition from \"" + from + "\" to \"" + to + "\"")

    var exitingStates  = transitionStates.toShared;
    var enteringStates = transitionStates.fromShared;

    return {exiting: exitingStates, entering: enteringStates};
};

// Returns all the actions, in correct order* that should be executed in a transition
// to toStateName in the FSM instance `fsmi`.
//
// * Order is as described in spec; exiting actions, from inside out, catted with 
//   entering actions, from outside in.
function actionsFromTransition(fsmi, to) {
    var states       = transitions(getFsm(fsmi), getCurrentStateName(fsmi), to),
        exitActions  = _.mapcat(states.exiting,
                                _.partial(U.getIn, ['actions', 'exit'], [])),
        enterActions = _.mapcat(states.entering,
                                _.partial(U.getIn, ['actions', 'enter'], []));
    return _.cat(exitActions, enterActions);
}


// Sends an event and its args to the FSM instance, returns updated
// FSM instance.
//
// NB: mutates fsmi, can cause side effects!
//
// `callback` gets updates FSM instance and the response object 
// e.g. callback(fsmi, response)
function send(fsmi, userContext, event, callback) {
    var fsm              = getFsm(fsmi),
        locals           = getLocals(fsmi),
        currentStateName = getCurrentStateName(fsmi),
        eventArgs        = eventArgs || {},
        response         = {};
    fsmi.lastEvent = event; 

    var context = {
        event:  {name: fsmi.lastEvent.name,
                 args: fsmi.lastEvent.args},
        local:  fsmi.locals,
        global: GLOBAL_PARAMS,
        user:   userContext
    };

    // The states from the root state to the current state
    // -- these recieve event actions in order (if & until one transitions)
    var statesToCurrent = DFS(fsm, U.getter('states'), function(node) {
        return node.name === currentStateName;
    });

    var evs = _.mapcat(statesToCurrent, _.partial(U.getIn,['actions', 'event'], []));
    executeActions(evs, fsmi, context, response, callback);
};


// Executes all the `actions`, transitioning if necessary (and 
// then executing the exit/enter actions as necessary).
//
// `response` isn't required; if omitted, an empty {} is passed through instead.
// 
// `callback` will be called at the end of all execution of all actions, 
// and transitions (and actions following from that), with the new FSM instance
// and the response object (expected to have keys headers (an object), body (a string
// or object to be converted to JSON), responded (boolean; if a procedure has set 
// the other keys), and status (an integer; HTTP status code)
function executeActions(actions, fsmi, context, response, callback) {
    if (_.isFunction(response))  return callback = response, response = {};
    if (_.falsey(actions) || _.isEmpty(actions))  return callback(fsmi, response);

    var action = reifyAction(PROCEDURES, _.first(actions));

    execute(action, fsmi, context, response, callback, function(fsmi, ctx, resp) {
        executeActions(_.rest(actions), fsmi, ctx, resp, callback);
    });
}


// Executes all the procedures in the given action, and executing necessary 
// actions if there is a transition.
//
// `next` is a callback which is passed (fsmi, context, response)
// called when the action is done executing, if there's been no transition (which
// would short-circuit execution of the rest of the actions;
//
// if there's been a transition, executeActions is instead called with the new actions
function execute(action, fsmi, context, response, callback, next) {
    if (!action || action.length === 0)  return next(fsmi, context, response);

    var procedure = _.first(action);
    if (_.isString(procedure)) {
        var actions = actionsFromTransition(fsmi, procedure);
        fsmi.currentStateName = procedure;
        return executeActions(actions, fsmi, context, response, callback);
    } else {
        procedure(context, response, function(ctx, resp, proceed) {
            fsmi.locals = ctx.local;
            if (! proceed)  return next(fsmi, ctx, resp);
            return execute(_.rest(action), fsmi, ctx, resp, callback, next);
        });            
    }
}


// Reifies all the constituent procedures in a given action.
// c.f. reifyProcedure
function reifyAction(procedureMap, action) {
    return _.map(action, _.partial(reifyProcedure, procedureMap));
}


// Maps the procedure name in the the JSON representation to the JS (host) functions
// they should be looking up, and partilly applies them to the parameters passed
// in aforesaid JSON represenation.
function reifyProcedure(procedureMap, procedure) {
    if (_.isArray(procedure) && procedure.length > 0) {
        var fn = procedureMap[procedure[0]];
        if (!fn) throw new Error("Procedure does not exist: " + procedure[0]);
        return _.partial(fn, _.rest(procedure));
    } else if (_.isString(procedure)) {
        return procedure;
    } else {
        throw new Error("Bad procedure spec: " + JSON.stringify(procedure));
    }
}


// Returns the value of the nested keys (in keyPath) in context.
//
// If the value doesn't exist, return undefined.
var findIn = function(context, keyPath) {
    return _.reduce(keyPath, function(res, key) {
        if (res === undefined) return res
        return res[key];
    }, context);
};


// # Depth-First Search
//
// Search a tree, branching on the children returned by childrenFn
// and stopping when targetFn returns true on a value.
//
// Returns the shortest path to that value.
//
// NB: Destroys the stack, evealuates the entire tree (even if not necessary).
//     Should be lazy and tail-recursive (and then trampolined).
var DFS = function(root, childrenFn, targetFn) {
    function _DFS(node, path) {
        path = _.cons(node, path);
        if (!_.exists(node)) return null;
        else if (targetFn(node)) return path.reverse();
        else return _.first(_.compact(_.map(childrenFn(node), function (node) {
            return _DFS(node, path);
        })));
    }
    return _DFS(root, []);
};


// Returns the path to a shared node between nodes, and a path from that node
// to the node identified by the target function.
//
// Used for transitions between nodes.
//
// NB: Runs DFS twice on the tree. This is not optimal.
var pathBetween = function(fsm, childrenFn, sourceFn, targetFn) {
    // DFS finds the paths to each node; afterwards we must find where they
    // intersect to determine the path between them.
    var statesToCurrent = DFS(fsm, childrenFn, sourceFn);
    var statesToTarget = DFS(fsm, childrenFn, targetFn);

    if (_.isEmpty(statesToCurrent) || _.isEmpty(statesToTarget)) return false;

    var idx1 = 0, idx2 = 0;
    var n1 = statesToCurrent[idx1],
        n2 = statesToTarget[idx2];

    // Since we're starting at the root of the tree (as that's where DFS starts)
    //  the nodes are the same until the path diverges.
    while (n1 && n2 && n1.name === n2.name) {
        idx1++; idx2++;
        n1 = statesToCurrent[idx1];
        n2 = statesToTarget[idx2];
    } // note we check for n1, n2 existence; if they don't, it means
    // we're transitioning to the same node. cool story. just FYI.

    // Returns the path to (right before) the shared now), and
    // the path from right after the shared node to the target.
    return {toShared: statesToCurrent.slice(idx1),   // the nodes we exit
            fromShared: statesToTarget.slice(idx2)}; // the nodes we enter
};


  //////////////////////////
 /////// EXPORTS //////////
//////////////////////////
_.extend(exports, {send: send, reify: reify, fsm: getFsm, findStateIn: findStateIn,
                   lastEvent: lastEvent, currentStateName: getCurrentStateName,
                   locals: getLocals, DFS: DFS, pathBetween: pathBetween});
