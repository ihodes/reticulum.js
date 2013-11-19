# Marion State Machines API Docs

Marion State Machines exposes an API for creating, reifying, and interacting with networked, extended finite state machines (eFSMs).

The base URL is

    http://api.marion.io/v1

Authentication is conducted via basic auth; there are no user-names for generic interactions: just the API Secret is needed for the password, e.g. `http//:api-secret@api.marion.io`.

## Listing FSMs

All available FSMs (under your account) can be listed by GETing in JSON form at `/fsm` or in HTML at `/fsm/all`

## Creating FSMs

FSMs can be created by POSTing a JSON object with the following keys to the endpoint `/fsm`.

The object should look like so:

```json
{
  "name": "<name of the FSM>"
  "fsm": {FSM OBJECT}
}
```

The FSM Object should follow the format described in the [FSM Spec](https://gist.github.com/ihodes/f009cc66422232f411b6).

## Editing FSMs

FSMs can be edited by PUTing a new JSON object (of the same form) to the endpoint `/fsm/<fsm-id>`.

FSMs can also be edited via the HTML/JS GUI at the endpoint `/fsm/<fsm-id>/show`

## Reify FSMs

FSMs can be reified, which means that an instance of the FSM is created. This instance is the object to which message will be sent and the magic of the FSM is exposed through.

To reiofy a FSM, POST to the endpoint `/fsm/<fsm-id>/reify`.

## List all FSM Instances

To list all the FSM instances of a given FSM in JSON form, GET `/fsm/<fsm-id>/instances`.

## Show FSM and FSM Instances

To show in JSON form an FSM object, GET `/fsm/<fsm-id>`. In HTML form, which will also allow you to edit the FSM, GET `/fsm/<fsm-id>/edit`.

To show in JSOn for an instance of an FSM (but not the FSM itself), GET `/fsm/<fsm-id>/<fsm-instance-id>`. In HTML, which will show the (live) current state of the FSM instance as well, GET `/fsm/<fsm-id>/<fsm-instance-id>/show`

## Send a Message to a FSM Instance

To send a message to a FSM instance, simply POST to `/fsm/<fsm-id>/<fsm-instance-id>/send/<message>`. Right now messages must be URL-encoded; this is changing soon.
