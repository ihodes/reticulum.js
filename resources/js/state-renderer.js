var displayFsm = function(sel, fsm, currentStateName) {
    var w          = d3.select(sel).style("width").slice(0, -2) * 1,
        h          = d3.select("html").style("height").slice(0,-2) * 1.6,
        opts       = { diameter: w > h ? h : w,
                       currentStateName: currentStateName };

    var svg = d3.select(sel).append("svg").attr("width", w).attr("height", h);

    render(fsm, opts);

    var stateAdder = renderPalette(svg, {width: w, height: h});
    stateAdder.call(stateAddDragHandler(fsm, opts));

    d3.select(".loading").style("display", "none");
};


function posToStates(pos, nodes) {
    return states = nodes.filter(function(node) {
        var cpt = {x: node.x, y: node.y};
        var r = node.r;
        return withinCircle(cpt, r, { x: pos.x, y: pos.y });
    })
}

function posToState(pos, nodes) {
    var states = posToStates(pos, nodes)
    var state = _.first(_.sortBy(states[0], function(n) { return -n.__data__.depth; }));
    return state;
}

function posToOtherStates(pos, nodes) {
    return states = nodes.filter(function(node) {
        var cpt = {x: node.x, y: node.y};
        var r = node.r;
        return !withinCircle(cpt, r, { x: pos.x, y: pos.y });
    })
}
    
function nodeClass(currentState) {
    return function(d) { 
        var addl = "";
        if (d.depth === 0)
            addl = "root"
        else if (d.name === currentState)
            addl = "current";
        else if (d.parent.initialStateName === d.name)
            addl = "initial";
        else if (!d.children)
            addl = "leaf";
        return "node " + addl;
    };
}

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
      if (this.parentNode)
          this.parentNode.appendChild(this);
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


function render(fsm, opts) {
    var diameter         = opts.diameter,
        currentStateName = opts.currentStateName;

    var pack = d3.layout.pack()
        .children(function (d) { return d.states; })
        .value(function(d){ return 1/(d.depth+1); })
        .size([diameter, diameter])
        .padding(30);

    var data = pack.nodes(fsm);

    window.fsm = fsm;
    window.data = data;

    var node = d3.select("svg").selectAll(".node")
        .data(data, getter('name'));

    var nodes = node.enter().append("g")
        .attr("class", "node") // Necessary for the `node` selector to work.
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    nodes.append("circle").attr("r", function(d) { return 0; });
    nodes.append("text");

    node.attr("class", nodeClass(currentStateName))
        .call(dragHandler())
        .transition()
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    
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
        });
    

    node.exit().remove();

}

function dragHandler() {
    var nodes = d3.selectAll(".node");
    var DRAG = {
        start: function(d, i) {
            if(d3.select(this)[0][0].__data__.depth == 0) return;

            d3.select(this).select("circle")
                .transition()
                .attr("r", function(d) { return d.r/1.2; })
            d3.select(this).moveToFront();
            
            _.each(allChildren(d), function(child, idx) {
                nodes.filter(function(d, i) { return d.name == child.name; })
                    .moveToFront()
                    .select("circle")
                    .transition()
                    .attr("r", function(d) { return d.r/(1.2*d.depth/2); });
            });
        },

        move: function(d, i) {
            if(d3.select(this)[0][0].__data__.depth == 0) return;

            d.x += d3.event.dx;
            d.y += d3.event.dy;

            _.each(allChildren(d), function(child) {
                child.x += d3.event.dx;
                child.y += d3.event.dy;
                });

            position(nodes);
        },

        end: function(d, i) {
            if(d3.select(this)[0][0].__data__.depth == 0) return;

            d3.select(this).select("circle")
                    .transition().duration(300)
                .attr("r", function(d) { return d.r; })
                .ease("elastic");
            
                _.each(allChildren(d), function(child, idx) {
                    nodes.filter(function(d, i) { return d.name == child.name; })
                        .select("circle")
                        .transition()
                        .attr("r", function(d) { return d.r; })
                        .ease("elastic");
                });
            
            position(nodes);
        }
    };
    var drag = d3.behavior.drag()
        .on("dragstart", DRAG.start)
        .on("drag", DRAG.move)
        .on("dragend", DRAG.end);
    return drag;
}

function writeToInfoBar(text) {
    d3.select("#current-state").text(text)
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

function findStateIn(root, name) {
    return (function finder(currentNode) {
        if (currentNode.name == name) return currentNode;
        else return _.first(_.compact(_.map(currentNode.states, finder)));
    })(root);
}


  //////////////////
 ///// Palette ////
//////////////////


function renderPalette(svg, dims) {
    var width  = 150,
        height = 200;

    var palette = svg.append("g")
        .attr("transform", "translate(" + (dims.width-width-10) +", 10)");
    
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

   var newState = palette.append("g")
        .attr("transform", "translate(" + width/2 + "," + height/2 + ")")
        .attr("class", "add");

    newState.append("circle")
        .attr("r", "50")

    newState.append("text")
        .text("Add A State")
        .style("font-size", "14px")
        .style("font-weight", "200")
        .attr("dy", ".3em")
        .style("text-anchor", "middle");
    
    return newState;
}


var stateAddDragHandler = function(fsm, opts) {
    return d3.behavior.drag()
        .on("drag", function() {
            var nodes = d3.selectAll("g.node");
            d3.select(this).attr("transform", function(d) {
                return "translate(" + d3.event.x + "," + d3.event.y + ")";
            });
            
            var pos = currentPosition();
            
            posToOtherStates(pos, nodes)
                .select("circle")
                .transition()
                .duration(400)
                .attr("r", function(d, i) { return d.r; })
                .ease("elastic");
            
            posToStates(pos, nodes)
                .select("circle")
                .transition()
                .duration(400)
                .attr("r", function(d, i) { return d.r + 20 })
                .ease("elastic");
        })
        .on("dragend", function() {
            var nodes = d3.selectAll("g.node");
            var state = posToState(currentPosition(), nodes);
            var stateName = state ? state.__data__.name : "undefined";

            var adder = d3.select(this);
            
            if (stateName === "undefined") {
                // TK TODO should do this right... 
                adder.transition().ease("elastic")
                    .attr("transform", "translate(75,100)");
            } else {
                // TK TODO This should be better... need to encapsulate and re-render
                adder.select("circle").attr("r", 0);
                adder.select("text").style("fill-opacity", 0.00001);
                adder.attr("transform", "translate(75,100)");

                adder.select("circle")
                    .transition()
                    .ease("elastic")
                    .duration(2000)
                    .attr("r", 50);
                adder.select("text")
                    .transition()
                    .duration(2000)
                    .ease("elastic")
                    .style("fill-opacity", 1);

                var state = findStateIn(fsm, stateName);
                var newStateName = "<NEW STATE "+String(Date.now())+">";
                if (!state.states) {
                    state.initialStateName = newStateName;
                    state.states = [];
                }
                state.states.push({ name: newStateName });
                render(fsm, opts);
            }
            
            writeToInfoBar(stateName);
        });
};


String.prototype.hashCode = function(){
    var hash = 0, i, char;
    if (this.length == 0) return hash;
    for (i = 0, l = this.length; i < l; i++) {
        char  = this.charCodeAt(i);
        hash  = ((hash<<5)-hash)+char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};
