all:
	foreman run supervisor app.js


.PHONY: test

test:
	vows test/* --spec
