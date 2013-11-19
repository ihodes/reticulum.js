var displayFsm = function(sel, fsm, currentStateName, next) {
    var w    = d3.select(sel).style("width").slice(0, -2) * 1,
        h    = d3.select(sel).style("height").slice(0,-2) * 1,
        opts = { diameter: w > h ? h : w,
                 currentStateName: currentStateName,
                 w: w, h: h };

    window.fsm = fsm;
    setRef("fsm", fsm);
    setRef("selectedState", fsm);

    watch("fsm", function(n, o) {
        renderFSM(n, opts);
    }, {freeze: hashFsm});
    watch("selectedState", function(n, o) {
        selectState(n);
    }, {freeze: hashFsm});

    d3.select("#save-fsm").on("click", function(){
        d3.select("#save-fsm").text("Saving...");
        d3.select("#save-fsm").style("background-color","#efefef");
        d3.select("#save-fsm").style("cursor","default");
        d3.xhr("/v1/fsm/"+window.location.pathname.split('/')[3])
            .header("Content-type", "application/json")
            .send('PUT',  '{"fsm":'+hashFsm(window.fsm)+'}', function(err, resp){
                console.log("ERROR: ", err);
                console.log("RESPONSE: ", resp);
                d3.select("#save-fsm").text("Save FSM");
                d3.select("#save-fsm").style("background-color","white");
                d3.select("#save-fsm").style("cursor","pointer");
            })
    })

    initializeSvg(sel, opts);
    selectState(deref("selectedState"));
    renderFSM(deref("fsm"), opts);

    next();
};

function renderFSM(fsm, opts) {
    var diameter         = opts.diameter,
        currentStateName = opts.currentStateName,
        svg              = d3.select("svg");

    var pack = d3.layout.pack()
        .children(function (d) { return d.states; })
        .value(function(d){ return 1/(d.depth+1); })
        .size([diameter, diameter])
        .padding(30);

    function doTree(root, visitor, children) {
        visitor(root);
        _.each(children(root), function(n){doTree(n, visitor, children)});
    }
    doTree(fsm, function(state) { 
        if (state.states && state.states.length === 0)  delete state["children"]; 
    }, getter("states"));
    var data = pack.nodes(fsm);

    _.each(data, function(node) {
        // hack so that states with one substate aren't overwhelmed
        if (node.parent && node.parent.children.length == 1)
            node.r *= 0.5;
        if (! node.rash) node.rash = rash(); // give them UUIDs...hacky ones ! HACK
    });

    var linkData = generateLinks(data);

    var node = svg.selectAll(".node")
        .data(data, getter("rash"));

    var link = svg.selectAll(".link")
        .data(linkData, function(d) { return hashFsm(d.source) + hashFsm(d.target)});

    var nodes = node.enter().append("g")
        .attr("class", "node") // Necessary for the `node` selector to work.
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    nodes.filter(function(d) { return !d.parent; })
      .append("rect")
        .attr("x", _.compose(negate, getter("x")))
        .attr("y", _.compose(negate, getter("y")))
        .attr("width", opts.w)
        .attr("height", opts.h);

    nodes.filter(function(d) { return !!d.parent; })
        .append("circle")
        .attr("r", 0);

    nodes.on("click",  _.partial(setRef, "selectedState"));

    nodes.append("text");

    var links = link.enter().append("path");

    link.attr("class", "link")
        .attr("marker-end", "url(#marker)");

    node.attr("class", nodeClass(currentStateName));

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
            if (d.states && d.states.length > 0)
                return "translate(0," + (20 - d.r) + ")";
        });

    reconnect(link.transition());
    position(node.transition());

    link.exit().remove();
    node.exit().remove();
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



  /////////////////////
 // FSM operations  //
/////////////////////

function allChildren(node) {
    if (node.children)
        return _.reduce(node.children,
                        function(a, b) { return a.concat(allChildren(b)); },
                        node.children);
    else return [];
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
            if (index !== -1) {
                root.states.splice(index, 1);
                if (state.name === root.initialStateName)
                    if (root.states.length > 0) {
                        root.initialStateName = root.states[0].name;
                    } else {
                        delete root["initialStateName"];
                        delete root["states"];
                    }
            } else {
                _.each(root.states, _.partial(_removeState, state));
            }
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

function getter(key) {
    return function (o) { return o[key]; }
};

function negate(x) { return -x; };

function hashFsm(x) {
    var cache = [];
    return JSON.stringify(x, function(key, val) {
        var ignoredKeys = ['x', 'y', 'r', 'or', 'depth', 'value', 'children', 'rash'];
        if (_.contains(ignoredKeys, key)) return;
        if (_.isObject(val) && val !== null) {
            if (cache.indexOf(val) !== -1) return;
            else cache.push(val);
        }
        return val;
    });
};


  //////////////////////////////
 /// Control Panel Controls ///
//////////////////////////////

function selectState(state) {
    // Handle highlighing of the selected node
    d3.selectAll(".node").classed("selected", false);
    d3.selectAll(".node").filter(function(d) {
        return d.name === state.name;
    }).classed("selected", true);
    
    // 
    // Initialize and change state name
    //
    d3.select("input#state-name").node().value = state.name || "";
    
    d3.select("#state-name").on("keyup", function() {
        var statename = d3.select("#state-name").node().value;
        var oldname = state.name;
        state.name = statename;
        if (state.parent && state.parent.initialStateName === oldname)
            state.parent.initialStateName = statename;
    });    

    //
    // Set up initial state changer etc
    //
    var initialStateOptions = d3.select("#initial-state-name").selectAll("option")
        .data(state.states || []);
    
    initialStateOptions.exit().remove();
    initialStateOptions.enter().append("option")

    initialStateOptions
        .attr("value", getter("name"))
        .text(getter("name"))
      .filter(function(d) { return d.name === state.initialStateName; })
        .property("selected", true);

    d3.select("#initial-state-name").on("change", function(){
        state.initialStateName = this.value;
    });


    //
    // Populate, interact with Event, Enter, Exit action sections
    //
    _.each(['event', 'enter', 'exit'], function(actionType) {
        var data = (state.actions ? state.actions[actionType] : []) || [];
            
        var actions = d3.select("#"+actionType).selectAll("li")
            .data(data, JSON.stringify);
        actions.enter()
            .append("li").append("pre").append("textarea")
            .html(function(d) { return JSON.stringify(d, undefined, 2); })
            .on("change", function(d, i) {
                console.log("HURR ");
                try {
                    // NB this is nasty mutation. TK HACK MUTATION FML JAVASCRIPT WHY.
                    var state = deref("selectedState");
                    state.actions[actionType].splice(i, 1, JSON.parse(this.value));

                    d3.select(this).style("border", "none");
                } catch (e) {
                    d3.select(this).style("border", "1px dashed red");
                }
            });
        actions.append("button").attr("class", "remove-action-button")
            .text("X").on("click", function(d, i){
                this.parentElement.remove();
                var state = deref("selectedState");
                state.actions[actionType].splice(i, 1);
            });
        actions.exit().remove();
    });

    d3.select("#add-event-action").on("click", function() {
        addAction("event");
    });
    d3.select("#add-enter-action").on("click", function() {
        addAction("enter");
    });
    d3.select("#add-exit-action").on("click", function() {
        addAction("exit");
    });

    // ^ need to add these new actions (and edited old actions) to the FSM
    // TK TODO START HERE ^^^^^ 

    //
    // Adding and removing states
    //
    d3.select("#add-state").on("click", function() {
        var newstate = {name: ""};
        insertStateInto(deref("fsm"), state, newstate);
        setRef("selectedState", newstate);
    });
    d3.select("#remove-state").on("click", function() {
        var state = deref("selectedState");
        if (state.parent) {
            var nextState = state.parent;
            removeState(deref("fsm"), state);
            setRef("selectedState", nextState);
        } else {
            // No op -- Can't remove the root node (display msg to user here TK TODO)
        }
    });
}

function initializeSvg(sel, opts) {
    var svg = d3.select(sel).append("svg");
    svg.attr("width", opts.w).attr("height", opts.h);

    // Define the transitions' arrow head
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

    return svg;
}

function addAction(actionType, actionArray) {
    var actions = d3.select("ul#"+actionType).append("li")
    var state = deref("selectedState");

    state.actions || (state.actions = {});
    state.actions[actionType] || (state.actions[actionType] = []);
    state.actions[actionType].push([]);

    actions.append("pre").append("textarea")
        .attr("placeholder", "Enter action text here...")
        .on("change", function(d, i) {
            console.log("CHANGED");
            try { // COPIED FROM selectState(...) TK DRY
                // NB this is nasty mutation. TK HACK MUTATION FML JAVASCRIPT WHY.
                var state = deref("selectedState");
                state.actions[actionType].splice(i, 1, JSON.parse(this.value));
                
                d3.select(this).style("border", "none");
            } catch (e) {
                d3.select(this).style("border", "1px dashed red");
            }
        });
    actions.append("button").attr("class", "remove-action-button")
        .text("X").on("click", function(){
            this.parentElement.remove();
        });
}


  /////////////
 // Helpers //
/////////////

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

function conj(x, xs) { return cat([x], xs); }
function mapcat(array, fun) { return cat.apply(null, _.map(array, fun)); }

function rash() {
    return String(Math.random()) + String(Math.random()) + String(Math.random(0));
}


  ////////////////////
 // Hacky FRP/refs //
////////////////////

/* Listens for a change to the value at `key` in `ref`, calling `action(val)`
   if the value of val changes.
   
   The value is compared to its last value, using `===`. `freeze` can be
   passed in `opts` as a pre-processor to comparison; this is useful if
   you wish to ignore certain properties of `val`. Freeze must be side-effect
   free. Otherwise, nothing is safe.
   
   *By default, changes are calculated every 10ms, but this can be set by
   passing in `delay` in `opts`.*
*/
function watch(key, action, opts) {
    var opts   = opts || {},
        freeze = opts.freeze || _.identity,
        delay  = opts.delay || 10,
        val    = deref(key),
        frozen = freeze(val);
    
    return setInterval(function() {
        val = deref(key)
        if (freeze(val) !== frozen) {
            frozen = freeze(val);
            action(val);
        }
    }, delay);
}

window.__STATE__ = {};

function deref(key) {
    if (window.__STATE__[key] === undefined) throw "No ref \""+key+"\"";
    return window.__STATE__[key];
}

function setRef(key, val) {
    window.__STATE__[key] = val;
    return val;
}

function updateRef(key, fn) {
    if (window.__STATE__[key] === undefined) throw "No ref \""+key+"\"";
    var args   = _.toArray(arguments).slice(2),
        val    = deref(key);
        args   = conj(val, args),
        newval = fn.apply(null, args);
    return setRef(key, newval);
}

