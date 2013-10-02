See `docs.md` for documentation. More to come. 

To set up, `cp .envTemplate .env`, make sure you have foreman installed via the heroku toolbelt, `npm install` deps, and run with `make`.

Test with `vows test/* --spec`. Need vows in order to run tests `npm install vows -g`.

##### Todo: 

1. Handing all enter/exit actions when transitions through multiple states (what's the proper UML SM way to do this?)
1. Implement guards
1. Create API for creating FSMs via HTTP
1. GUI
1. Hook up to backing services e.g. Twilio, Mailgun to start
1. Schedule reification of FSMs (can schedule with a given global state object; this
   allows reifying FSMs with e.g. environment variables for a given task, or information
   the FSM would need to message a given person...)
1. Schedule backing services to run
1. Communication via message queues and busses (pubsub model)
1. Store everything on Mongo/Redis (for persistence) and allow loading of stored fsmMs (should just store fsmM in mongo...)
1. Auth

