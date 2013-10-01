# FSM

A FSM looks like:

```json
{
  "stateA": {
    "actions": {
      "event": [
        "anAction1"
        "anAction2"
      
        "transitionFn1Name",
        "transitionFn2Name",
        ["guard1Name", "guard2Name", "transitionFn3Name"]
      ],
      "enter": [
        "anAction3"
      ],
      "exit": [
        "anAction4"
      ]
    },
    
    "substates": {
      "substateA1": {
        ...
      }
    }
  }
  
  "stateB": {
     ...
  }
}
```

Where guards and transitions are looked up in a user-local hashtable which maps names to functions we (Marion Tech) specify.

Our private API looks like: 

```
return(fsm, initialStatePath, globals) // globals default is {}
//=> fsmM
```

A fsmM represents the finite state machine, its current state and the last event recieved, as well as a history of all the states and events recieved. It is the primary object we operate on, as it encompasses the current state of a FSM instance as well as its history, allowing us to be very flexible in what we do with it. In JavaScript: 

```
fsmM
//=> [fsm, [statePath, globals, [eventName, args]], history]
```

`stateName` is the name of a state; state names are assumed to be unique. Behavior is undefined if state names are not unique.

`globals` is an object of keys to value; this is expected to be modified by actions. 

`eventName` is simply the string name of the event which is passed a given action; this so happens to represent the last event recieved, regardless of if it caused a transition. 

`args` is array of arguments sent along with the `eventName`.

`history` is a chronological array of `[stateName, globals, [eventName, args]]`.


### Functions which operate on and `fsmM`

Once we've recieved an fsmM from `return`, which can be thought of as reifying a FSM JSON object, we can do a number of things with it.

```javascript
send(fsmM, event, ...args)
```

`send` sends an event and arguments to the fsmM, triggering actions and transitioning the machine appropriately. Returns a new fsmM with the last state, global, event in the history, and setting a new current state. The first event actions which returns a non-null/undefined value will attempt to transition the state machine to that state. Actions are executed in-order.

```javascript
currentState(fsmM)
//=> [stateName, global, [eventName, args]]
```

Returns the current state 3-tuple.


```javascript
history(fsmM)
//=> [[statePath, global, [eventName, args]], ...]
```

Returns history of the fsmM.


```javascript
fsm(fsmM)
//=> fsm
```

Returns the fsm object being used to transition the machine.


