var displayFsm = function(sel, fsm, currentStateName) {
    var w          = d3.select(sel).style("width").slice(0, -2) * 1,
        h          = d3.select("html").style("height").slice(0,-2) * 1.6,
        opts       = { diameter: w > h ? h : w,
                       currentStateName: currentStateName };

    var svg = d3.select(sel).append("svg").attr("width", w).attr("height", h);

    var stateFinder = _.partial(findStateIn, fsm);

    svg.append("svg:defs")
      .append("svg:marker")
        .attr("id", "marker")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 8)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
      .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");
    
    setInterval(function(cache) {
        return function() {
            if (hashFsm(fsm) !== cache) {
                render(fsm, opts);
                renderPalette(stateFinder);
                cache = hashFsm(fsm);
            }
        };
    }(), 100)

    d3.select(".loading").style("display", "none");
};


function generateLinks(nodes) {
    // Only nodes with event actions can possible transition;
    // let's just look at those.
    var nodesWithEvents = _.filter(nodes, function(node) {
        return node.actions && node.actions.event;
    });

    // An action can possibly transition if the last part in it is a string
    // which is presumably the name of a state to transition to.
    var doesTransition = _.compose(_.isString, _.last);

    // Concat all of the lists we generate of possible links from source
    // states to target states.
    return mapcat(nodesWithEvents, function(node) {
        var transitions = _.filter(node.actions.event, doesTransition);
        return _.map(transitions, function(action) {
            var target = _.findWhere(nodes, {name: _.last(action)});
            return {source: node, target: target, action: action};
        });
    });
} // Yes this could be ~3x faster; no, it probably doesn't matter.


function positionToStates(pos, nodes) {
    return nodes.filter(function(d) {
        var cpt = {x: d.x, y: d.y};
        var r = d.r;
        return withinCircle(cpt, r, { x: pos.x, y: pos.y });
    });
}

function positionToState(pos, nodes) {
    var states = positionToStates(pos, nodes);
    var state = _.first(_.sortBy(states[0], function(n) {return -n.__data__.depth;}));
    return state;
}

function positionToOtherStates(pos, nodes) {
    return states = nodes.filter(function(d) {
        var cpt = {x: d.x, y: d.y};
        var r = d.r;
        return !withinCircle(cpt, r, { x: pos.x, y: pos.y });
    });
}
    
function nodeClass(currentState) {
    return function(d) { 
        var addl = "";
        if (d.depth === 0)
            addl = "root";
        else if (d.name === currentState)
            addl = "current";
        else if (d.parent.initialStateName === d.name)
            addl = "initial";
        else if (!d.children)
            addl = "leaf";
        return "node " + addl;
    };
}

// Disabled... not sure I want this...
d3.selection.prototype.moveToFront = function() {
    return this;  // disabler
    return this.each(function() {
        if (this.parentNode)  this.parentNode.appendChild(this);
    });
};

function allChildren(node) {
    if (node.children)
        return _.reduce(node.children,
                        function(a, b) { return a.concat(allChildren(b)); },
                        node.children);
    else return [];
}

function position(nodes) {
    nodes.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
    });
}

function reconnect(links) {
    links.attr("d", function(d) {
        var target = {x: d.target.x, y: d.target.y, r: d.target.r},
            source = {x: d.source.x, y: d.source.y, r: d.source.r},
            dx     = target.x - source.x,
            dy     = target.y - source.y;

        var angle;
        if (dx === 0 && dy === 0)
            throw new Error("Cannot connect concentric circles.");
        else if (dx === 0)
            angle = Math.PI/2;
        else
            angle = Math.atan(dy/dx);

        if (dx > 0) angle += Math.PI;

        target.x += target.r * Math.cos(angle);
        target.y += target.r * Math.sin(angle);

        source.x -= source.r * Math.cos(angle);
        source.y -= source.r * Math.sin(angle);

        var dx = target.x - source.x,
            dy = target.y - source.y,
            dr = Math.sqrt(dx * dx + dy * dy);

        return "M" + source.x + "," + source.y + "A" 
            + dr + "," + dr + " 0 0,1 " + target.x + "," 
            + target.y;
    });
}

function render(fsm, opts) {
    var diameter         = opts.diameter,
        currentStateName = opts.currentStateName,
        svg              = d3.select("svg");

    svg.on("mousedown", function() {
        var toElementName = d3.event.toElement.tagName.toLowerCase();
        if (toElementName !== 'text' && toElementName !== 'input')
            d3.selectAll("input").remove();
    })

    var pack = d3.layout.pack()
        .children(function (d) { return d.states; })
        .value(function(d){ return 1/(d.depth+1); })
        .size([diameter, diameter])
        .padding(30);


    var data     = pack.nodes(fsm);
    _.each(data, function(node) {
        if (node.parent && node.parent.children.length == 1)
            node.r *= 0.5;
    });
    var linkData = generateLinks(data);


    window.fsm = fsm;
    window.data = data;


    var node = svg.selectAll(".node")
        .data(data, getter("name"));
    var link = svg.selectAll(".link")
        .data(linkData, function(d) { return hashFsm(d.source) + hashFsm(d.target)});

    var nodes = node.enter().append("g")
        .attr("class", "node") // Necessary for the `node` selector to work.
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
    nodes.append("circle").attr("r", function(d) { return 0; });
    nodes.append("text");

    var links = link.enter().append("path")

    link.attr("class", "link")
        .attr("marker-end", "url(#marker)");

    node.attr("class", nodeClass(currentStateName))
        .call(dragHandler(fsm))

    node.select("circle")
        .transition()
        .attr("r", function(d) { return d.r; })
        .ease("elastic");

    node.select("text")
        .text(function(d) { return d.name; })
        .style("font-size", function(d) { return 2/(d.depth+1)+"em"; })
        .style("font-weight", "500")
        .style("text-anchor", "middle")
        .attr("dy", ".3em")
        .attr("transform", function(d) {
            if (d.children) return "translate(0," + (20 - d.r) + ")";
        })
        .on("click", textEditHandle);

    
    // Opens up the name editing input when a new state is added to the diagram
    node.filter(function(d) {
        return d.name === '';
    }).call(function(node) {
        if (node.node()) {
            var d = node.node().__data__;
            _.bind(textEditHandle, node.select("text").node())(d);
        }
    });

    reconnect(link.transition());
    position(node.transition());

    link.exit().remove();
    node.exit().remove();
}

function textEditHandle(d) {
    var height = 26;
    var width  = d.r * 2;
    var text = d3.select(this);
    var g = d3.select(this.parentNode);
    g.append("foreignObject")
        .attr("width", width)
        .attr("height", height)
      .append("xhtml:body")
        .style("position", "relative")
      .append("input")
        .style("position", "absolute")
        .style("left", d.x-width/2+"px")
        .style("top", d.y-height/2+"px")
        .style("font-size", (2/(d.depth+1))+"em")
        .attr("value", d.name)
        .attr("placeholder", "Enter a Name...")
        .call(function(node) { node.node().focus(); })
        .on("keydown", function() {
            if (d3.event.keyCode === 13) { // enter
                if (this.value.length === 0) {
                    message('error', 'New State Requires a Name');
                    return;
                }

                if (d.parent && d.parent.initialStateName == d.name)
                    d.parent.initialStateName = this.value;

                if (_.contains(_.pluck(window.data, 'name'), this.value)) {
                    message('error', 'States must have unique names');
                    return;
                }

                d.name = this.value;
                text.text(this.value);
                this.remove();
            } else if (d3.event.keyCode === 27) { // esc
                if (this.value.length === 0 && text.text().length === 0) {
                    message('error', 'New State Requires a Name');
                    return;
                }

                this.remove();
            }
        });
}


function dragHandler(fsm) {
    var nodes = d3.selectAll(".node");
    var links = d3.selectAll(".link");
    var DRAG = {
        start: function(d, i) {
            var clickedElName = d3.event.sourceEvent.target.tagName.toLowerCase();
            if (clickedElName === 'input' || clickedElName === 'body') return;
            if (d.depth == 0) return;

            d3.select(this).select("circle")
                .transition()
                .duration(100)
                .attr("r", function(d) {
                    d.or = d.r;
                    d.r = d.r/1.2;
                    return d.r;
                })
            d3.select(this).moveToFront();
            
            reconnect(links.transition());

            _.each(allChildren(d), function(child, idx) {
                nodes.filter(function(d, i) { return d.name == child.name; })
                    .moveToFront()
                    .select("circle")
                    .transition()
                    .duration(100)
                    .attr("r", function(d) { 
                        d.or = d.r;
                        d.r = d.r/(1.2*d.depth/2);
                        return d.r;
                    });
            });

            reconnect(links.transition().duration(50));
        },

        move: function(d, i) {
            var clickedElName = d3.event.sourceEvent.target.tagName.toLowerCase();
            if (clickedElName === 'input' || clickedElName === 'body') return;
            if (d.depth == 0) return;

            d.x += d3.event.dx;
            d.y += d3.event.dy;

            _.each(allChildren(d), function(child) {
                child.x += d3.event.dx;
                child.y += d3.event.dy;
            });

            var otherNodes = d3.selectAll("g.node").filter(function(node) {
                return node.name !== d.name;
            });
            var underState = positionToState({x: d.x, y: d.y}, otherNodes);
            if (!underState) { // then we're going to be deleting this if we drop it...
                d3.select(this).select("circle")
                    .style("fill", "#982323");
            } else {
                d3.select(this).select("circle")
                    .style("fill", null);
            }

            position(nodes);
            reconnect(links);
        },

        end: function(d, i) {
            var clickedElName = d3.event.sourceEvent.target.tagName.toLowerCase();
            if (clickedElName === 'input' || clickedElName === 'body') return;
            if (d.depth == 0) return;

            var thisName  = d.name;
            var thisState = findStateIn(fsm, thisName);

            var otherNodes = d3.selectAll("g.node").filter(function(node) {
                return node.name !== thisName;
            });

            var state = positionToState({x: d.x, y: d.y}, otherNodes);
            var stateName = state ? state.__data__.name : undefined;


            if (stateName === undefined)
                removeState(fsm, thisState);


            d3.select(this).select("circle")
                    .transition().duration(300)
                .attr("r", function(d) { 
                    d.r = d.or;
                    return d.r;
                })
                .ease("elastic");

            _.each(allChildren(d), function(child, idx) {
                nodes.filter(function(d, i) { return d.name == child.name; })
                    .select("circle")
                    .transition()
                    .attr("r", function(d) { 
                        d.r = d.or;
                        return d.or;
                    })
                    .ease("elastic");
            });

            position(nodes);
            reconnect(links.transition().ease("elastic"));
        }
    };
    var drag = d3.behavior.drag()
        .on("dragstart", DRAG.start)
        .on("drag", DRAG.move)
        .on("dragend", DRAG.end);
    return drag;
}


function findStateIn(root, name) {
    return (function finder(currentNode) {
        if (currentNode.name == name) return currentNode;
        else return _.first(_.compact(_.map(currentNode.states, finder)));
    })(root);
}


function removeState(fsm, state) {
    var removedStateName = state.name;

    function _removeState(state, root) {
        if (root.states) {
            var index = root.states.indexOf(state);
            if (index !== -1)
                root.states.splice(index, 1);
            else
                _.each(root.states, _.partial(_removeState, state));
        }
    }
    _removeState(state, fsm);

    // Also, remove all transitions to this state...
    function _removeTransitionsTo(name, state) {
        if (state.actions && state.actions.event)
            state.actions.event = _.filter(state.actions.event, function(action) {
                return _.last(action) !== name;
            });
        if (state.states)
            _.each(state.states, _.partial(_removeTransitionsTo, name));
    }
    _removeTransitionsTo(removedStateName, fsm);
    
}


function insertStateInto(fsm, state, thisState) {
    // Inserts thisState into state's states
    // and removes it from wherever it was before.
    removeState(fsm, thisState);
    if (state.states) {
        state.states.push(thisState);
    } else {
        state.initialStateName = thisState.name;
        state.states = [thisState];
    }
}

function currentPosition() {
    return {x: d3.event.sourceEvent.offsetX, y: d3.event.sourceEvent.offsetY};
}

function distance(p1, p2) {
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    return Math.sqrt((dx*dx) + (dy*dy));
}

function withinCircle(cpt, r, pt) {
    return distance(cpt, pt) < r;
}

function getter(key) { return function (d) { return d[key]; } };

function hashFsm(x) {
    var cache = [];
    return JSON.stringify(x, function(key, val) {
        var ignoredKeys = ['x', 'y', 'r', 'or'];
        if (_.contains(ignoredKeys, key)) return;
        if (_.isObject(val) && val !== null) {
            if (cache.indexOf(val) !== -1) return;
            else cache.push(val);
        }
        return val;
    });
};

function message(type, text) {
    if (text === undefined)
        text = type, type = 'notice';
    if (! _.contains(['error', 'alert', 'notice'], type))
        throw new Error("Message not of recognized type. Must be one of error, alert, notice.")
    d3.select("#messages")
      .append("div")
        .attr("class", "msg " + type)
        .text(text)
        .style('display', 'block')
        .call(function() {
            var el = this;
            setTimeout(function () {
                el.remove(); 
            }, 1500);
        });
}


  //////////////////
 ///// Palette ////
//////////////////


function renderPalette(stateFinder) {
    var svg    = d3.select("svg"),
        width  = 150,
        height = 200,
        w      = Number(svg.attr("width"));

    d3.select("#palette").remove();

    var palette = d3.select("svg").append("g").attr("id", "palette")
        .attr("transform", "translate(" + (w-width-10) +", 10)");
    
    palette.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "#f0f0f0")

    palette.append("text")
        .text("Palette")
        .style("font-size", "20px")
        .style("font-weight", "700")
        .attr("dy", "1.4em")
        .attr("dx", "1.1em");

   var adder = palette.append("g")
        .attr("transform", "translate(" + width/2 + "," + height/2 + ")")
        .attr("class", "add")
        .call(adderDragHandler(stateFinder, {width: width, height: height}));
    
    adder.append("circle")
        .attr("r", 0)
        .transition()
        .ease("elastic")
        .attr("r", 50);

    adder.append("text")
        .text("Add A State")
        .style("font-size", "14px")
        .style("font-weight", "200")
        .attr("dy", ".3em")
        .style("text-anchor", "middle");
    
    return palette;
}


var adderDragHandler = function(stateFinder, opts) {
    return d3.behavior.drag()
        .on("drag", function() {
            var nodes = d3.selectAll("g.node");
            d3.select(this).attr("transform", function(d) {
                return "translate(" + d3.event.x + "," + d3.event.y + ")";
            });
            
            var pos = currentPosition();
            
            positionToOtherStates(pos, nodes)
                .select("circle")
                .transition()
                .duration(400)
                .attr("r", function(d, i) { return d.r; })
                .ease("elastic");
            
            positionToStates(pos, nodes)
                .select("circle")
                .transition()
                .duration(400)
                .attr("r", function(d, i) { return d.r + 20; })
                .ease("elastic");
            reconnect(d3.selectAll(".link"));
        })
        .on("dragend", function() {
            var nodes = d3.selectAll("g.node");
            var state = positionToState(currentPosition(), nodes);
            var stateName = state ? state.__data__.name : "undefined";

            var adder = d3.select(this);
            
            if (stateName === "undefined") {
                adder.transition().ease("elastic")
                    .attr("transform",
                          "translate("+(opts.width/2)+","+(opts.height/2)+")");
            } else {
                this.remove();

                var state = stateFinder(stateName);
                var newStateName = "";
                if (!state.states) {
                    state.initialStateName = newStateName;
                    state.states = [];
                }
                state.states.push({ name: newStateName });
                
            }
        });
};


// Helpers

var concat  = Array.prototype.concat;
function cat() {
    return _.reduce(arguments, function(acc, elem) {
        if (_.isArguments(elem)) {
            return concat.call(acc, slice.call(elem));
        }
        else {
            return concat.call(acc, elem);
        }
    }, []);
}

function mapcat(array, fun) {
    return cat.apply(null, _.map(array, fun));
}

function radiansInDegrees(radians) {
    return (180/Math.PI) * radians;
}
