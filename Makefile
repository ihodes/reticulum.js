all:
	foreman run supervisor index.js


.PHONY: test

test:
	vows test/* --spec
