var displayFsm = function (fsm, initialState, currentState) {
    var radius = 25,
        spc    = 30,
        height = 300,
        width  = 800;
    
    var svg = d3.select("#diag").append("svg:svg")
        .attr("height", height).attr("width", "100%")
        .style("display", "none");

    var links = _.map(fsm, function(val, key) { 
        var links = []
        if (val.actions && val.actions.event) {
            _.each(val.actions.event, function(evt) {
                console.log(_.first(evt))
                // TK TODO: split out transitions and events etc.
                //          (don't hardcode here and below)
                if(_.contains(['ifEqTransitionTo', 'transitionTo'], _.first(evt)))
                    links.push({source: key, target: _.last(evt), type: _.first(evt)});
            });
        }
        return links;
    });
    links = _.flatten(links);
    window.links = links;

    var nodes = {};
    links.forEach(function(link) {
        link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
        link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
    });
    window.nodes = nodes;

    var force = d3.layout.force()
      .nodes(d3.values(nodes))
      .links(links)
      .size([width, height])
      .linkDistance(100)
      .charge(-300)
      .on("tick", tick)
      .start();
    
    // Per-type markers, as they don't inherit styles.
    svg.append("svg:defs").selectAll("marker")
        .data(["transitionTo", "ifEqTransitionTo", "ifGeoEvent"])
      .enter().append("svg:marker")
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 22)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
      .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");
    
    var path = svg.append("svg:g").selectAll("path")
        .data(force.links())
        .enter().append("svg:path")
        .attr("class", function(d) { return "link " + d.type; })
        .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });
    
    var circle = svg.append("svg:g").selectAll("circle")
        .data(force.nodes()).enter()
      .append("svg:circle")
        .attr("class", function (d) {
            if (d.name === currentState)
                return "current";
            else if (d.name === initialState)
                return "initial";
            else return "";
        })
        .attr("r", 12)
        .call(force.drag);
    
    var text = svg.append("svg:g").selectAll("g")
        .data(force.nodes())
        .enter().append("svg:g");
    
    // A copy of the text with a thick white stroke for legibility.
    text.append("svg:text")
        .attr("x", 8)
        .attr("y", ".31em")
        .attr("class", "shadow")
        .text(function(d) { return d.name; });
    
    text.append("svg:text")
        .attr("x", 8)
        .attr("y", ".31em")
        .text(function(d) { return d.name; });

    // Use elliptical arc path segments to doubly-encode directionality.
    function tick() {
        path.attr("d", function(d) {
            var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        });
        
        circle.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
        
        text.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    }
    
    // remove the loading gif once we get here...
    d3.select(".loading").style("display", "none");
    d3.select("svg").style("display", "block");
};
