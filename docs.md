# FSM

[see below for JSON example]

Where guards and transitions are looked up in a user-local hashtable which maps names to functions we (Marion Tech) specify.

Our private API looks like: 

```
return(fsm, locals) // locals default is {}
//=> fsm instance
```

A fsm instance represents the finite state machine, its current state and the last event recieved. It is the primary object we operate on, as it encompasses the current state of a FSM instance, allowing us to be very flexible in what we do with it. In JavaScript: 

```
fsm instance
//=> {fsm: fsm, locals: {...},  currentStateName: '...', lastEvent: {name: '...', args: {...}}}
```

`currentStateName` is the name of a state; state names are assumed to be unique. Behavior is undefined if state names are not unique.

`locals` is an object of keys to value; this is expected to be modified by actions. 

`name` is simply the string name of the event which is passed a given action; this so happens to represent the last event recieved, regardless of if it caused a transition. 

`args` is array of arguments sent along with the event.


### Functions which operate on and `fsm instance`

Once we've recieved an fsm instance from `return`, which can be thought of as reifying a FSM JSON object, we can do a number of things with it.

```javascript
send(fsm instance, event, ...args)
```

`send` sends an event and arguments to the fsm instance, triggering actions and transitioning the machine appropriately. Returns a new fsm instance with the last state, global, event in the history, and setting a new current state. The first event actions which returns a non-null/undefined value will attempt to transition the state machine to that state. Actions are executed in-order.


### FSM in JSON Example

A FSM looks like:

```json
{
    "name": "driver",
    "initialState": "OffCall",
    "states": [
        { "name" : "OffCall",
          "actions" : {
              "event" : [ [["if", "eq", "goOnCall"], "OnCall"] ]
          }
        },
        { "name" : "OnCall",
          "initialState" : "Idle",
          "actions" : {
              "event" : [ [["if" "eq" "updateLocation"]
                           ["set" ".location" "..location"]] ]
          },
          "states" : [
              { "name" : "Idle",
                "actions": {
                    "event": [ [["if", "eq", "accept"],
                                ["send", "Ride", "..ride.id", "accept", "driverId::.id"],
                                ["set", ".currentRide", "..ride"],
                                "EnRoute"],
                               [["if", "eq", "goOffDuty"], "OffDuty"] ],
                    "enter": [ [["clear", ".currentRide"]] ]
                }
              },
              { "name" : "EnRoute",
                "actions": {
                    "event": [ [["if", "eq", "pickUp"],
                                ["send", "Ride", ".currentRide.id", "pickedUp"],
                                "Driving"],
                               [["if", "eq", "decline"], // driver cancels ride
                                ["send", "Ride", ".currentRide.id", "decline"],
                                "Idle"],
                               [["if", "eq", "cancel"], // rider cancels ride
                                "Idle"] ],
                    "enter": [ [["sync", "Ride", ".currentRide.id", "driverLocation::.location"]] ] // update ride's driverLocation as it changes locally
                }
              },
              { "name" : "Driving",
                "actions": {
                    "event" : [ [["if", "eq", "dropoff"],
                                 ["send", "Ride", ".currentRide.id", "droppedOff"],
                                 "Delivered"], ],
                    "exit"  : [ [["unsync", "Ride"]] ] // stop syncing all attributes with Rides
                }
              },
              { "name" : "Delivered",
                "actions": {
                    "event": [ [["if", "eq", "sendFeedback"],
                                ["request", "post", ["@UberWebhookUrl", "/feedback"],
                                 "feedback::..feedback",
                                 "rideId::.currentRide.id",
                                 "driverId::.id"],
                                "Idle"], ]
                }
              }
          ]
        }
    ]
}

```
