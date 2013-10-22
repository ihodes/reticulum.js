See `docs.md` for documentation. More to come. 

To set up, `cp .envTemplate .env`, make sure you have foreman installed via the heroku toolbelt, `npm install` deps, and run with `make`. Test with `make test`. Need vows in order to run tests (`npm install vows -g`).

reticulum implements the [FSM spec](https://gist.github.com/ihodes/f009cc66422232f411b6).


#### Todo: 
###### Higher Priorities
1. Remote Mongo documents
  
##### Test...
1. User context gets passed along and works well
1. Tests for each action
1. More error tests (make sure the API returns reasonable errors)

###### Lower Priorities
1. better logging (in app and for FSM instances; instances should log to a certain place that users can see...)
1. make it nicer/easier to update user's context (right now you have to replace the entire JSON)
1. GUI for creating/editing FSMs /fsm/new.html
1. Hook up to backing services e.g. Twilio, Mailgun to start
1. Schedule reification of FSMs (can schedule with a given global state object; this
   allows reifying FSMs with e.g. environment variables for a given task, or information
   the FSM would need to message a given person...)
1. inter-fsm communication via message queues and busses (pubsub model)?
1. more actions?
