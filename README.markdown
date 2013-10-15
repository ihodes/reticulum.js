See `docs.md` for documentation. More to come. 

To set up, `cp .envTemplate .env`, make sure you have foreman installed via the heroku toolbelt, `npm install` deps, and run with `make`. Test with `make test`. Need vows in order to run tests (`npm install vows -g`).

reticulum implements the [FSM spec](https://gist.github.com/ihodes/f009cc66422232f411b6).


#### Todo: 
###### Higher Priorities
1. Initializing FSMs with default locals
1. Actions: 
  1. send (to other FSM instaces in group),
  1. reify (to other FSMs in group),


###### Lower Priorities
1. GUI for creating/editing FSMs /fsm/new.html
1. Hook up to backing services e.g. Twilio, Mailgun to start
1. Schedule reification of FSMs (can schedule with a given global state object; this
   allows reifying FSMs with e.g. environment variables for a given task, or information
   the FSM would need to message a given person...)
1. inter-fsm communication via message queues and busses (pubsub model)?
1. more actions?
