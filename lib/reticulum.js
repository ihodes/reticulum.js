/* jslint node: true */
'use strict';

var _ = require('underscore');
var logger = require('./logger').logger;
var U = require('./utils');
require('underscore-contrib');



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

    return {fsm: fsm, currentStateName: fsm.initialState || null,
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


var findStateIn = function(root, name) {
    return (function __letrec(currentNode) {
        if (currentNode.name == name) return currentNode;
        else return _.first(_.compact(_.map(currentNode.states, __letrec)));
    })(root);
};


  //////////////////
 /// Public API ///
//////////////////

// Sends an event and its args to the FSM instance, returns updated
//  FSM instance. 
//
// (DOES modify the FSM instance passed. This is not a safe fn.)
var send = function(fsmi, eventName, args) {
    var fsm = getFsm(fsmi),
        locals = getLocals(fsmi),
        currentStateName = getCurrentStateName(fsmi);

    fsmi.lastEvent = {name: eventName, args: args};

    var statesToCurrent = DFS(fsm, U.getter('states'), function(node) { return node.name === currentStateName;});

    var state, action, res;
    for (var idx in statesToCurrent) {
        state = statesToCurrent[idx];
        
        if (state.actions && state.actions.event) {
            for (var eidx in state.actions.event) {
                action = state.actions.event[eidx];
                res = executeAction(fsmi, action);
                if (_.isString(res)) return transition(fsmi, res);
            }
        }
    }
    
    return fsmi;
};



// Transitions the FSM instance, returning the new instance and executing the appropriate
// enter and exit actions along the way.
var transition = function(fsmi, transitionToStateName) {
    var transitionState = findStateIn(getFsm(fsmi), transitionToStateName);
    if (! transitionState) throw new Error("State \""+transitionToStateName+"\" does not exist; cannot transition to it.");
    while (transitionState.initialState)
        transitionState = findStateIn(getFsm(fsmi), transitionState.initialState);
    transitionToStateName = transitionState.name;
 
    var transitions = pathBetween(getFsm(fsmi), U.getter('states'),
                                  function(n1, n2) { return n1.name == n2.name; },
                                  function(node) { return node.name === getCurrentStateName(fsmi);},
                                  function(node) { return node.name == transitionToStateName; });
    var exitingStates = transitions.toShared;
    var enteringStates = transitions.fromShared;

    // executes exits until reaching a shared supernode, then execute enters through the final node
    var idx, idx_, state, action;
    for (idx in exitingStates) {
        state = exitingStates[idx];
        if (state.actions && state.actions.exit) {
            for (idx_ in state.actions.exit) {
                action = state.actions.exit[idx_];
                executeAction(fsmi, action);
            }
        }
    }

    for (idx in enteringStates) {
        state = enteringStates[idx];
        if (state.actions && state.actions.enter) {
            for (idx_ in state.actions.enter) {
                action = state.actions.enter[idx_];
                executeAction(fsmi, action);
            }
        }
    }
    
    fsmi.currentStateName = transitionToStateName;
    return fsmi;
};


// Executes an action, whatever it is, and returns a transition if there is one, else null
var executeAction = function(fsmi, action) {
    var part, partName, actionFn, params, res;
    for (var idx in action) {
        part = action[idx];

        if (_.isString(part)) return part; // then we're transitioning
        
        actionFn = ACTIONS[part[0]];
        if (! actionFn) continue; // TK TODO or throw, because we're calling a non-existent action.
        // (need a uniform way of handling these errors); for now, we let it pass. ideally, won't validate fsms with bad actions
        // if (!_.exists(actionFn)) throw new Error("Procedure or guard \"" + partName + "\" is undefined.");
    
        // TK TODO maybe shouldn't reify params here?
        // should be done within actions; some params shouldn't be reified (e.g. keys for `set`)
        params = _.rest(part);
        params = reifyParams(params, fsmi.locals, fsmi.lastEvent.args);
        res = actionFn(fsmi.locals, fsmi.lastEvent.name, fsmi.lastEvent.args).apply(null, params);

        if (res == false) break;
    }
    return false;
};


// Looks up params that are keys in locals, group, user, and global context if necessary
var reifyParams = function(params, locals, args) {
    return _.map(params, _.partial(reifyParam, locals, args));
};


// Looks up a particular param if necessary, returns the actual value of it.
var reifyParam = function(locals, args, param) {
    if (_.isArray(param)) // then we need to join it
        return reifyParams(param, locals, args).join('');
    else if (_.isString(param)) {
        var firstChar = param.charAt(0);
        switch (firstChar) {
            case '.': // local context or args
              if (param.charAt(1) === '.')
                  param = lookup(param.slice(2).split('..'), args);
              else param = lookup(param.slice(1).split('.'), locals);
              break;
            case '$': // group context
              param = lookup(param.slice(1).split('$'), {} /* group */); // TK TODO
              break;
            case '@': // user context
              param = lookup(param.slice(1).split('@'), {} /* user */); // TK TODO
              break;
            case '!': // global context
              if (param.charAt(1) === '!') {
                  var paramFn = lookup(param.slice(2).split('!!'), GLOBAL_PARAMS);
                  param = paramFn(); // GLOBAL_PARAMS are functions
              }
              break;
            case '\\': // escaping a special char
              param = param.slice(1);
              break;
        }
        return param;
    } 
    else return param;
};


var lookup = function(path, context) {
    return _.reduce(path, function(key, _, res) {
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
//     Should be lazy and tail-recursive (and then trampolined) to make this legit.
var DFS = function(root, childrenFn, targetFn) {
    var visited = [];
    function _DFS(node, path) {
        path = _.cons(node, path);
        if (!_.exists(node)) return null;
        else if (targetFn(node)) return path.reverse();
        else return _.first(_.compact(_.map(childrenFn(node), function (node) { return _DFS(node, path); })));
    }
    return _DFS(root, []);
};


// Returns the path to a shared node between nodes, and a path from that node
//  to the node identified by the target function. Used for transitions between
//  nodes.
// NB: Runs DFS twice on the tree. This is not optimal.
var pathBetween = function(fsm, childrenFn, cmpFn, sourceFn, targetFn) {
    // This finds the paths to each node; now we must find where they intersect
    //  to determine the path between them
    var statesToCurrent = DFS(fsm, childrenFn, sourceFn);
    var statesToTarget = DFS(fsm, childrenFn, targetFn);

    if (_.isEmpty(statesToCurrent) || _.isEmpty(statesToTarget)) return false;

    var idx1 = 0, idx2 = 0;
    var n1 = statesToCurrent[idx1], n2 = statesToTarget[idx2];

    // Since we're starting at the root of the tree (as that's where DFS starts)
    //  the nodes are the same until the path diverges.
    while (cmpFn(n1, n2)) {
        idx1++; idx2++;
        n1 = statesToCurrent[idx1];
        n2 = statesToTarget[idx2];
    }

    // Returns the path to (right before) the shared now), and 
    //  the path from right after the shared node to the target.
    return {toShared: statesToCurrent.slice(idx1).slice(1),   // the nodes we exit
            fromShared: statesToTarget.slice(idx2).slice(1)}; // the nodes we enter
};




  ////////////////////////////////////////
 /////// Actions  and GLOBAL_PARAMS /////
////////////////////////////////////////

/// ALL actions and guards get treated the same way; 
/// They are curried functions which first take
/// the current FSM instance's locals, then
/// the last eventName, then the last event's args.
///
/// Then, they are applied to the arguments passed to 
/// them via the FSM.

var ACTIONS = {
    'log': function(locals, eventName, eventArgs) {
        return function() {
            var args = _.toArray(arguments);
            logger.info.apply(null, _.cons("LOG from FSM: ", args));
            return true;
        };
    },
    'if': function(locals, eventName, eventArgs) {
        return function() {
            var args = _.toArray(arguments);
            var testType = args[0];
            if (testType === 'eq') {
                return eventName === args[1];
            } else if (testType === 'neq') {
                return eventName !== args[1];
            } else {
                return false;
            }
        };
    },

    // TK TODO make these work for nested keys, work with params (don't reify the key, for example, 
    //  and only allow clearing & storage in local context).
    'set': function(locals, eventName, eventArgs) {
        return function(key, val) {
            locals[key] = val;
            return true;
        };
    },
    'clear': function(locals, eventName, eventArgs) {
        return function(key) {
            delete locals[key];
            return true;
        };
    },
    'reify': function(locals, eventName, reventArgs) {
        return function(/*args*/) { return true; };
    }
};


var GLOBAL_PARAMS = {
    'NOW': function () {
        Date.now();
    }
};



  //////////////////////////
 /////// EXPORTS //////////
//////////////////////////
_.extend(exports, {send: send, reify: reify, fsm: getFsm,
                   lastEvent: lastEvent, currentStateName: getCurrentStateName,
                   locals: getLocals, DFS: DFS, pathBetween: pathBetween});


