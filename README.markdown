See `docs.md` for documentation. More to come. 

To set up, `cp .envTemplate .env`, make sure you have foreman installed via the heroku toolbelt, `npm install` deps, and run with `make`. Test with `make test`. Need vows in order to run tests (`npm install vows -g`).

reticulum implements the [FSM spec](https://gist.github.com/ihodes/f009cc66422232f411b6).

##### Todo: 


###### Higher priorities 
1. Tests for HTTP (and more for reticulum itself)
1. FSM validation
1. Fix param reification in ret. (see notes)
1. Initializing FSMs with default locals
1. Message-passing between FSM instances
1. RPC for reififcation of FSMs from other FSM instances
1. Allow requests to be made from FSMs (and results saved as JSON and stored in a key)
1. More actions for funsies?

--- 
lower prios

1. Create API for modifying/constructing FSMs piecewise via HTTP
1. GUI for creating FSMs /fsm/new.html =
1. Hook up to backing services e.g. Twilio, Mailgun to start
1. Schedule reification of FSMs (can schedule with a given global state object; this
   allows reifying FSMs with e.g. environment variables for a given task, or information
   the FSM would need to message a given person...)
1. inter-fsm communication via message queues and busses (pubsub model)
1. Auth
1. atomic mongo trans
