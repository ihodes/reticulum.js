var displayFsm = function (fsm) {
    // TK TODO dynamic diameter
    var diameter = 550,
        format = d3.format(",d");

    var svg = d3.select("#diag").append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
      .append("g")
        .attr("transform", "translate(0,0)");
    
    svg.append('svg:defs').append('svg:marker')
        .attr('id', 'end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 6)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
      .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#545454');

    var pack = d3.layout.pack()
        .children(function (d) { return d.states; })
        .value(function(d){ return 1/(d.depth+1); })
        .size([diameter - 4, diameter - 4])
        .padding(20);

    var diagonal = d3.svg.diagonal.radial()
        .source(function(d) {
            console.log(d);
            var target = {x: Math.floor(d.target.x), y: Math.floor(d.target.y)};
            var z = {x: Math.floor(d.source.x), y: Math.floor(d.source.y)};
            var r = d.source.r;
            var r45 = Math.sin(Math.PI/4)*r;

            if (z.x > target.x && z.y > target.y) {
                z.x -= r45;
                z.y -= r45;
            } else if (z.x < target.x && z.y > target.y) {
                z.x += r45;
                z.y -= r45;
            } else if (z.x < target.x && z.y < target.y) {
                z.x += r45;
                z.y += r45;
            } else if (z.x > target.x && z.y < target.y) {
                z.x -= r45;
                z.y += r45;
            } 

            if (z.y == target.y && z.x < target.x ) { z.x += r-4; z.y -= 5;}
            else if (z.y == target.y && z.x > target.x ) { z.x -= r-4; z.y += 5;}

            if (z.x == target.x && z.y < target.y ) z.y += r;
            else if (z.x == target.x && z.y > target.y ) z.y -= r;

            return z;
        })
        .target(function(d) {
            var source = {x: Math.floor(d.source.x), y: Math.floor(d.source.y)};
            var z = {x: Math.floor(d.target.x), y: Math.floor(d.target.y)};
            var r = d.target.r;
            var r45 = Math.sin(Math.PI/4)*r;

            if (z.x > source.x && z.y > source.y) {
                z.x -= r45;
                z.y -= r45;
            } else if (z.x < source.x && z.y > source.y) {
                z.x += r45;
                z.y -= r45;
            } else if (z.x < source.x && z.y < source.y) {
                z.x += r45;
                z.y += r45;
            } else if (z.x > source.x && z.y < source.y) {
                z.x -= r45;
                z.y += r45;
            }

            if (z.y == source.y && z.x < source.x ) z.x += r+3;
            else if (z.y == source.y && z.x > source.x ) z.x -= r+3;

            if (z.x == source.x && z.y < source.y ) z.y += r;
            else if (z.x == source.x && z.y > source.y ) z.y -= r;

            return z;
        });
        
    var findStateIn = function(root, name) {
        return (function __letrec(currentNode) {
            if (currentNode.name == name) return currentNode;
            else return _.first(_.compact(_.map(currentNode.states, __letrec)));
        })(root);
    };

    
    // this should be wrapped in a closure and made ref. trans. 
    var links = [];
    // Sets the target attribute on each node that could possibley transition to another node.
    // ... this is what we'll use to set any special attributes for display using D3. 
    // recurseively visits states (and their children)
    (function __letrec(node, root) {
        if (node.actions && node.actions.event) {
            var targetNames = _.compact(_.map(node.actions.event, function(action) {
                if (_.isString(_.last(action)))
                    return _.last(action);
            }));
            var targets = _.compact(_.map(targetNames, _.partial(findStateIn, root)));
            _.each(targets, function(t) {
                links.push({source: node, target: t})
            })
            node.targets = targets;
        }
        _.each(node.states, function(node) { __letrec(node, root)});
    })(fsm, fsm);


    var node = svg.selectAll(".node")
        .data(pack.nodes(fsm))
      .enter().append("g")
        .attr("class", function(d) { 
            if (d.children)
                return "node";
            else if (d.parent.initialState == d.name)
                return "initial";
            else
                return "leaf";
        })
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    node.append("circle")
        .attr("r", function(d) { return d.r; });

    node.append("title")
        .text(function(d) { return JSON.stringify(d.actions); });

    node.filter(function(d) { return !d.children; }).append("text")
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
        .text(function(d) { return d.name.substring(0, d.r / 3); });

    node.filter(function(d) { return d.children; }).append("text")
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
        .style("font-size", "14px") // TK TODO should probably vary this depending on depth
        .style("font-weight", "700")
        .text(function(d) { return d.name; })
        .attr("transform", function(d) { return "translate(0," + (20-d.r) + ")"; });

    svg.selectAll(".transition")
        .data(links).enter()
      .append("path")
        .attr("class", "transition")
        .attr("d", diagonal)
        .style("marker-end", 'url(#end-arrow)');

    d3.select(".loading").style("display", "none");
    d3.select("svg").style("display", "block");
};
