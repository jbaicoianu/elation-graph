elation.require(['graph.external.d3', 'ui.base'], function() {
  elation.requireCSS('graph.force');
  elation.component.add('graph.force', function() {
    this.defaultcontainer = {tag: 'div'};
    this.init = function() {
      this.nodes = this.args.nodes || [];
      this.links = this.args.links || [];
      this.translate = [0, 0];
      this.scale = 1;

      this.create();
      this.updategraphargs();
    }
    this.create = function() {
      var width = 960, height = 500;
      this.graph = d3.layout.force()
        .size([width, height])
        .on("tick", elation.bind(this, this.tick));

      this.svg = d3.select(this.container).append("svg")
          .attr("width", width)
          .attr("height", height)

      this.zoom = d3.behavior.zoom().scaleExtent([.01, 10]).on("zoom", elation.bind(this, this.handlezoom));
      this.zoom.scale(this.scale);
      var g = this.svg.append("g")
            .call(this.zoom);
      this.overlay = g.append("rect")
          .attr("class", "overlay")
          .attr("width", width)
          .attr("height", height);
      this.graphroot = g.append("g")


      var marker = this.svg.append('svg:defs').selectAll("marker")
          .data("end")
          .enter().append('svg:marker')
            .attr("id", "link-arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", 0)
            .attr("markerWidth", 12)
            .attr("markerHeight", 12)
            .attr("orient", "auto")
          .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");


      //this.zoom(this.svg);

    }
    // Color leaf nodes orange, and packages white or blue.
    this.color = function(d) {
      return d._edges ? "#3182bd" : d.edges ? "#c6dbef" : "#fd8d3c";
    }
    this.tick = function() {
      var zoom = function(p, d) {
        var n = (p * this.scale) + this.translate[d];
        return Math.round(parseFloat(n) * 1000) / 1000; 
      }.bind(this);

      var scale = this.scale;
      this.link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; })
          .style("stroke-width", (1 / scale) + 'px');

      this.node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ") scale(" + (1.0 / scale) + ")"; });

    }

    this.updategraphargs = function(graphargs) {
      var defaults = {
        linkStrength: .1, 
        friction: .7, 
        distance: 20, 
        charge: function(n) { var c = -20 * (n.children.length + 1); if (n.name == 'ui.base') console.log(n.name, c); return c;}, 
        //charge: -60,
        gravity: .1, 
        theta: .8, 
        alpha: .1
      };
      var realargs = {};
      if (this.currentargs) {
        elation.utils.merge(this.currentargs, realargs);
      } else {
        elation.utils.merge(defaults, realargs);
      }
      elation.utils.merge(graphargs, realargs);
      this.graph
          .linkStrength(realargs.linkStrength)
          .friction(realargs.friction)
          .distance(realargs.distance)
          .charge(realargs.charge)
          //.chargeDistance(realargs.chargeDistance)
          .gravity(realargs.gravity)
          .theta(realargs.theta)
          .alpha(realargs.alpha);

      this.currentargs = realargs;
      this.refresh();
    }

    this.render = function() {
      this.graphroot.attr("transform", "translate(" + this.translate + ") scale(" + this.scale + ")");
      this.graph.resume();
    }

    this.update = function(data) {
      var nodedata = this.flatten(data),
          nodes = nodedata[0],
          links = nodedata[1];

      this.graph
          .nodes(nodes)
          .links(links);
      this.graph.start();

      this.drag = this.graph.drag()
            .on("dragstart", function(n) { n.fixed = true; this.dragging = true; }.bind(this))
            .on("dragend", function(n) { this.dragging = false; }.bind(this));

      var link = this.graphroot.selectAll(".link"),
          node = this.graphroot.selectAll(".node");

      this.node = node = node.data(nodes, function(d) { return d.id; }).style("fill", this.color);

      // Exit any old nodes.
      node.exit().remove();

      // Enter any new nodes.
      var g = node.enter().append("g")
          .attr("class", "node");
      g.append("circle")
          .attr("cx", 0)//function(d) { return d.x; })
          .attr("cy", 0)//function(d) { return d.y; })
          .attr("r", function(d) { return Math.sqrt(d.children.length + 1) * 4.5; })
          .style("fill", this.color);

      g.append("text")
          //.attr("dx", "-3em")
          .attr("dy", "1em")
          .text(function(d) { return d.name; });

      g.call(this.drag);

      // Update the links…
      this.link = link = link.data(links, function(d) { return d.source.id + "_" + d.target.id; });

      // Exit any old links.
      link.exit().remove();

      // Enter any new links.
      link.enter().insert("line", ".node")
          .attr("class", "link")

      this.refresh();
    }
    this.flatten = function(root) {
      var nodes = [], links = [], i = 0;
      var seenlinks = {};
      function recurse(node, toplevel) {
        if (node.edges) {
          node.children = node.edges;
          node.edges.forEach(function(n) {
            var linkid = node.name + '_' + n.name;
            if (node !== root && !seenlinks[linkid]) {
              seenlinks[linkid] = true;
              links.push({source: node, target: n});
            }
            recurse(n);
          });
        }
        if (!node.id) node.id = ++i;
        if (!toplevel) nodes.push(node);
      }

      recurse(root, true);
      return [nodes, links];
    }

    this.handlezoom = function() {
      if (!this.dragging) {
        this.scale = d3.event.scale;
        this.translate = d3.event.translate;
        this.refresh();
      } else {
        this.zoom.translate(this.translate);
        this.zoom.scale(this.scale);
      }
    }

  }, elation.ui.base);
});
