var reticulum = require('./reticulum');


var isString = function(val, key) {
    if (_.isString(val)) return true;
    else return key + " must be a String";
};


var isArrayOfStates = function(val, key) {
    if (!_.isArray(val)) return key + " must be an array of states";
    for (var idx = 0; i < val.length; idx++) {
        if (!validate(stateValidator, val[idx]))
            return key + "[" +idx+ "] must be a valid state";
    }
    return true;
};


var isScalar = U.complement(_.isObject);


var isNestedArrayOfScalars = function(val, key) {
    if (!_.isArray(val)) return key + " must be an array";
    for (var idx = 0; idx < val.length; idx++) {
        if (_.isArray(val[idx])) {
            var error = isNestedArrayOfScalars(val[idx], key+"["+idx+"]");
            if (_.isString(error)) return error;
        } else if (!isScalar(val[idx])) {
            return key + " ["+idx+"] must be a scalar or a nested array of scalars";
        }
    }
    return true;
};


var isArrayOfStates = function(val, key) {
    var errors = _.filter(_.map(val, fsmValidator), _.isString);
    if (errors[0]) return errors[0];
    else return true;
};


var stateValidateSpec = {
    name: [true, isString],
    initialStateName: [false, isString],
    states: [false, isArrayOfStates],
    actions: [false, {
        event: [false, isNestedArrayOfScalars],
        exit:  [false, isNestedArrayOfScalars],
        event: [false, isNestedArrayOfScalars]
    }]
};


var fsmValidator = function(fsm) {
    if ( _.has(fsm, 'initialStateName')) {
        if (!_.has(fsm, 'states'))
            return "fsm must have states if initialStateName is specified";
        if (!reticulum.findStateIn(fsm, fsm.initialStateName))
            return "initialStateName "+fsm.initialStateName+" must exist in the fsm";
    }
    if (!_.has(fsm, 'initialStateName') &&  _.has(fsm, 'states'))
        return "fsm must have initialStateName if states are specified";
    return loch.validate(stateValidateSpec, fsm);
};
