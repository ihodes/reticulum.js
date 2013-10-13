var reticulum = require('./reticulum'),
    loch      = require('loch'),
    _         = require('underscore');


var visString = loch.validator("{{key}} must be a String", _.isString);
var visArray = loch.validator("{{key}} must be an Array", _.isArray);

var isNestedArrayOfScalars = function(val, key) {
    for (var idx = 0; idx < val.length; idx++) {
        if (_.isArray(val[idx])) {
            var error = isNestedArrayOfScalars(val[idx], key+"["+idx+"]");
            if (_.isString(error)) return error;
        } else if (_.isObject(val[idx])) {
            return key + "["+idx+"] ("+JSON.stringify(val)+") must be an array (or nested array) of scalars";
        }
    }
    return true;
};


var containsOnlyStatesOf = function(fsm) {
    return function(val, key) {
        var errors = _.map(val, _.partial(stateValidator, stateValidatorSpec(fsm)));
        errors = _.filter(errors, function (val) { return val !== true; });
        if (errors[0]) return errors[0];
        else return true;
    };
};


var ifCouldTransitionEnsureStateExistsIn = function(fsm) {
    return function(actions, key) {
        var errors = _.compact(_.map(actions, function(action) {
            if (_.isString(_.last(action))) {
                if (!reticulum.findStateIn(fsm, _.last(action)))
                    return key + " must not have a transition to a state which does not exist ("+_.last(action)+")";
            }
        }));
        if (!_.isEmpty(errors)) return errors.join(', and ');
        else return true;
    };
};


var stateValidatorSpec = function(fsm) {
    return {
        name: [true, visString],
        initialStateName: [false, visString],
        // should have visArray here
        // but with it, invalid maps are valid... could be loch error...
        //            \/ < here
        states: [false, containsOnlyStatesOf(fsm)],
        actions: [false, {
            event: [false, visArray, isNestedArrayOfScalars,
                    ifCouldTransitionEnsureStateExistsIn(fsm)],
            exit:  [false, visArray, isNestedArrayOfScalars],
            enter: [false, visArray, isNestedArrayOfScalars]
        }]
    };
};


var stateValidator = function(spec, state) {
    if (_.has(state, 'initialStateName')) {
        if (!_.has(state, 'states'))
            return "state must have states if initialStateName is specified";
        if (!reticulum.findStateIn(state, state.initialStateName))
            return "initialStateName "+state.initialStateName+" must exist in the state";
    }
    if (!_.has(state, 'initialStateName') &&  _.has(state, 'states'))
        return "state must have initialStateName if states are specified";
    return loch.validates(spec, state);
};


var fsmValidator = function(fsm) {
    return stateValidator(stateValidatorSpec(fsm), fsm);
};
exports.fsmValidator = fsmValidator;
