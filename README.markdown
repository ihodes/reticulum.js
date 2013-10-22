See `docs.md` for documentation. More to come. 

To set up, `cp .envTemplate .env`, make sure you have foreman installed via the heroku toolbelt, `npm install` deps, and run with `make`. Test with `make test`. Need vows in order to run tests (`npm install vows -g`).

reticulum implements the [FSM spec](https://gist.github.com/ihodes/f009cc66422232f411b6).


#### Todo: 
###### Higher Priorities

 BELOW IN PROGRESS: need to deal with the basic auth madness, now. 
 --- 
1. Actions (need to separate concerns; keep the FSM away from actions)
  -- soln? perhaps just keep actions in reticulum, but pass required info via the userContext (see User-lebel context and lookup, above)
  1. send (to other FSM instaces in group),
  1. reify (to other FSMs in group),
  1. logging (needs to be improved)
1. Consider/ensure no race conditions
1. Remote Mongo documents
1. HTTP responses can be sent from FSMs
  1. should be paired with a way to stop event propagation
  
##### Test...
1. User context gets passed along and works well
1. Tests for each action
1. More error tests (make sure the API returns reasonable errors)


###### Lower Priorities
1. make it nicer/easier to update user's context (right now you have to replace the entire JSON)
1. GUI for creating/editing FSMs /fsm/new.html
1. Hook up to backing services e.g. Twilio, Mailgun to start
1. Schedule reification of FSMs (can schedule with a given global state object; this
   allows reifying FSMs with e.g. environment variables for a given task, or information
   the FSM would need to message a given person...)
1. inter-fsm communication via message queues and busses (pubsub model)?
1. more actions?
