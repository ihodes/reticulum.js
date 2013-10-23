# Reticulum

The networked state machine is a way to tie arbitrary events to contextual state and side-effects.

Reticulum is an implementation of networked extended finite state machines (neFSMs) defined and stored with JSON, as well as a set of procedures which the machines can execute. Additionally, it provides an secure HTTP API on top of these machines, as well as a granular authentication system for operating individual instances of a FSM. It also provided a simple HTML/JavaScript interface for navigating, operating, and visualizing these FSMs.

## Docs

Reticulum FSMs implements the specification found at spec.md.

Procedures implemented are documented at procedures.md.

Globals implemented are documented at globals.md.

## Setup

To set up, `cp .envTemplate .env`, make sure you have foreman installed via the [Heroku toolbelt](https://toolbelt.heroku.com/), run `npm install` to install dependencies. Additionally, [MongoDB](http://www.mongodb.org/) must be installed and running. Start the server with `make`.

You need [vows](http://vowsjs.org/) in order to run tests: `npm install vows -g`. Run test suite with `make test`.


### Todo: 
#### Primary
1. Define notion of adapters; ways to tie existing events in the world (emails, shipment tracking, tweets, phone calls, etc) to the FSM. Idea: concept of "adapters" which map the event to a POST to /send.
1. Refine API-abiity of FSM instances with respond method and others... should be able to communicate more information with a FSM with events.

#### Features
1. Better respond action... this is tricky.
1. Remote Mongo documents
1. better logging (in app and for FSM instances; instances should log to a certain place that users can see...)
1. make it nicer/easier to update user's context (right now you have to replace the entire JSON)
1. GUI for creating/editing FSMs /fsm/new.html
1. Schedule reification of FSMs (can schedule with a given global state object; this
   allows reifying FSMs with e.g. environment variables for a given task, or information
   the FSM would need to message a given person...)
1. inter-fsm communication via message queues and busses (pubsub model)?
1. more actions

#### Tests
1. Tests for each action
1. More error tests (make sure the API returns reasonable errors)
