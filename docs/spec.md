# Finite State Machine (FSM) Specification

A FSM is a state. A state shall have a `name` unique to all states & sub states within the FSM. A state  may have `actions` which specify transitions and procedures to execute on receipt of actions, under certain circumstances. A state may also designate an `initialStateName`, which indicates that the initial state of that state is in fact a sub state of the state. A state may also list sub states (which are just other states), under the name `states`. This makes a FSM a recursively defined datastructure, with the intial state being the super state of all other states. If `initialState` is specified, the state shall also have `states`, exactly one of which must have the name specified in `initialStateName`. Converesely if `states` is defined, `initialStateName` must be defined.

*For example:*

```json
{ "name": "The Machine",
  "actions" : {...},
  "initialStateName": "Some Substate",
  "states": [...]
}
```
      
`actions` is a map of action types (either 'event' for actions to be executed on receipt of an event, 'exit' for actions to be executed on transition out of that state, or 'enter' for actions which execute on entrance of that state) to a list of actions (further specified [below](#Action Spec).
      
`states` is an array of FSMs.
      
(The grammar of a JSON eFSM is formally—less key ordering within JSON objects, but disregard that—defined by [EBNF](http://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_Form) and [railroad diagrams](http://en.wikipedia.org/wiki/Syntax_diagram), with the EBNF found above and xhtml of svg diagrams + styling found [here](http://cl.ly/code/3D04431w2q33).)
      
## Action Specification
      
This section describes how actions shall be interpreted, both for the edification of the implementor and of the end user.
      
In the JSON representation of an FSM, under the `actions` key there would be an object with 0-3 of the following keys; `enter`, `exit`, or `event`. Each of these specifies an "occasion" the actions listed therein would be executed on. Actions listed under the 'event' occasion are executed when the FSM is sent an event. Actions listed under the 'exit' occasion are executed when the FSM transitions out of that state. Actions listed under the 'enter' occasion are executed when the FSM transitions into that state. 
      
Actions may prompt a transitions if all procedures within return true and if the last element in the Action is the name of a state in the FSM. Note that only Actions in the 'event' occasion can trigger a transition; those in 'exit' and 'enter' are considered no-ops.
      
The value of each of these keys is an array of actions. An action is an array of procedures with the last element optionally a string naming a state to transition to. 
      
A procedure is of the form `[name param*]`. The name specifies the procedure which will be executed. They may have required parameters, and optional parameters. [Parameters are decribed below](#Parameters).
      
Procedures are subroutines the FSM may execute. If they return true, the next procedure in the action will execute (or the machine will transition if the next part of the action sequence is a string. If not, the entire action is short-circuited, and the next action is executed (if any).
      
## Parameters
      
Params (parameters) are numbers or strings which can either refer to values in the Global FSM context, or the User context, or just be regular strings or numbers. If a parameter is an array of parameters, the parameters within are concatenated into a single string. `".key"` refers to the value at `key` in the local context, and `"@key"` refers to the value at `key` in the User context. Finally, `"!!key"` refers to the value at `key` in the global context of Marion State Machines (e.g. `"!!NOW"` would return 2013-10-05T18:35:00Z). 
      
Keys can be nested by separating subkeys with a period, like so: `".key.subkey"` or `"@key.subkey1.subkey2"` etc. to retrieve nested values. 
      
      
## FSM Instances

An instance of a finite state machine is a reification of the protocol defined by the FSM. In essence, a FSM instance is something which can recieve events and respond to them. The FSM itself is a specification which describes the behavior of the FSM instance.

Additionally, FSM instances maintain an internal state.
      
## Events 
      
An event is a string sent to a FSM instance, along with `args`, which is a JSON object sent in the POST data. 
      
## Action Execution Sequence 
      
When a FSM instance receives an event (and arguments), the event actions of the higher super states are executed sequentially, down to the next super state and so on until the current state's are finally executed (unless one of them transitions, thus short-circuiting the other event actions). If no transitions occur from the current state's event actions being executed, the super state (if any) recieves the event and runs its event actions (and so forth). When a state is exited (on transitions to another, [or the same state]), the exit actions are executed sequentially. When a state is entered, similarly, the enter actions are executed sequentially. 
      
When a transitions takes the current state from a nested state, all exit actions are executed when the passing through superstates on the way to the target state, and all enter actions are executed sequentially as it transitions through superstates to the target substate (should the target states be a substate of yet other superstates).
      
For example, in the following transition from stateA1 (a substate of stateA) to stateB1 (a substate of stateB): 
      
![stateA1_to_stateB1](http://cl.ly/image/2H2X251b001C/a1b1NestedTransition.png)
      
In this transition, the actions would be executed in this order: `beep`, `send_text`, `send_tweet`, `say_hi`, `boop`. This is because we first exit StateA1, then we exit StateA, then we enter StateB, then we enter StateB1. 
      
      
