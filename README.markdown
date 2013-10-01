See `docs.md` for documentation. More to come. 

Test with `vows test/* --spec`.

##### Todo: 

1. Handing all enter/exit actions when transitions through multiple states (what's the proper UML SM way to do this?)
2. Actions should be looked up by string (add `actions` object to the FSM) -- need to think about how to do this correctly
   should be able to register actions on a FSM/or globally... 
3. Implement guards
4. Proper JSON representation
5. Expose to network
   0. Reify FSMs via HTTP
   1. Allow posting of messages via HTTP
   2. inspect fsmM via HTTP
   3. visualize fsmM via HTTP
6. Create API for creating FSMs via HTTP
7. GUI
8. Hook up to backing services e.g. Twilio, Mailgun to start
9. Schedule reification of FSMs
10. Schedule backing services to run
11. Communication via message queues and busses (pubsub model)
12. Store everything on Mongo/Redis (for persistence) and allow loading of stored fsmMs (should just store fsmM in mongo...)
13. Auth

