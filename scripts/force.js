elation.require(['graph.external.d3', 'ui.base'], function() {
  elation.requireCSS('graph.force');

  /** 
   * Force-directed graph
   *
   * @class force
   * @augments elation.ui.base
   * @memberof elation.graph
   * @alias elation.graph.force
   *
   * @param {array}    nodes
   * @param {array}    links
   * @param {object}   graphargs
   */
  elation.component.add('graph.force', function() {
    this.defaultcontainer = {tag: 'div'};
    this.init = function() {
      this.nodes = this.args.nodes || [];
      this.links = this.args.links || [];
      this.translate = [0, 0];
      this.scale = this.args.scale || 1;
      this.graphargs = this.args.graphargs || {};

      if (this.args.classname) {
        this.addclass(this.args.classname);
      }

      this.create();
      this.updategraphargs(this.graphargs);
    }
    this.create = function() {
      var width = this.graphargs.width || 960, 
          height = this.graphargs.height || 500;

      this.width = width;
      this.height = height;

      this.graph = d3.layout.force()
        .size([width, height]);

      this.svg = d3.select(this.container).append("svg")
          .attr("width", width)
          .attr("height", height)

      var g = this.svg.append("g");
      if (this.args.interactive) {
        this.zoom = d3.behavior.zoom().scaleExtent([.1, 100]).on("zoom", elation.bind(this, this.handlezoom));
        this.zoom.scale(this.scale);
        g.call(this.zoom);
      }
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
      return d.color ? '#' + d.color : d._edges ? "#3182bd" : d.edges ? "#c6dbef" : "#fd8d3c";
    }
    this.tick = function() {
      if (this.args.interactive) {
        this.rendersvg();
      }
    }
    this.rendersvg = function() {
      var scale = this.scale;
      if (this.width != this.container.offsetWidth || this.height != this.container.offsetHeight) {
        //this.setsize([this.container.offsetWidth - 16, this.container.offsetHeight - 16]);
      }

      if (this.link) {
        this.link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; })
            .style("stroke-width", (1 / scale) + 'px')
            .attr("class", function(d) { var classes = ['link']; if (d.source.disabled || d.target.disabled) classes.push('state_disabled'); if (d.source.hover || d.target.hover) classes.push('state_hover'); return classes.join(' '); });
      }
      if (this.node) {
        var width = this.width,
            height = this.height,
            translate = this.translate,
            margin = 75;
/*
        this.node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ") scale(" + (1.0 / scale) + ")"; })
                 //.attr("display", function(d) { var m = margin * scale; var off = [(d.x * scale) + translate[0], (d.y * scale) + translate[1]];  var inbox = (off[0] > -m && off[1] > -m && off[0] < width + m && off[1] < height + m);  return (inbox ? 'block' : 'none'); });
                 .attr("class", function(d) { var classes = ['node']; var m = margin * scale; var off = [(d.x * scale) + translate[0], (d.y * scale) + translate[1]];  var inbox = (off[0] > -m && off[1] > -m && off[0] < width + m && off[1] < height + m);  if (!inbox) classes.push('state_hidden'); if (d.disabled) classes.push('state_disabled'); if (d.selected) classes.push('state_selected'); if (d.hover) classes.push('state_hover'); return classes.join(' '); });
        this.circles.attr("r", function(d) { return (Math.pow(d.children.length + 1, .25)) * this.scale * 5; }.bind(this))
        this.texts.attr("font-size", function(d) { var size = ((Math.pow(d.children.length + 1, .25)) / (.4 / scale));  size + "px" })
                  .attr("display", function(d) { var size = ((Math.pow(d.children.length + 1, .25)) / (.4 / scale));  return (size > 8 ? "block" : "none"); })
*/
      }
      if (this.groups) {
        this.groups.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                   .attr("class", function(d) { var classes = ['node']; var m = margin * scale; var off = [(d.x * scale) + translate[0], (d.y * scale) + translate[1]];  var inbox = (off[0] > -m && off[1] > -m && off[0] < width + m && off[1] < height + m);  if (!inbox) classes.push('state_hidden'); if (d.disabled) classes.push('state_disabled'); if (d.selected) classes.push('state_selected'); if (d.hover) classes.push('state_hover'); return classes.join(' '); });
        this.texts.attr("display", function(d) { var size = ((Math.pow(d.children.length + 1, .25)) / (.4 / scale));  return (size > 8 && size < 32 ? "block" : "none"); })
      }
    }
    this.updategraphargs = function(graphargs) {
      var defaults = {
/*
        linkStrength: .1, 
        linkDistance: 200, 
        friction: .7, 
        distance: 20, 
        charge: function(n) { var c = -20 * (n.children.length + 1); if (n.name == 'ui.base') console.log(n.name, c); return c;}, 
        //charge: -60,
        chargeDistance: Infinity,
        gravity: .1, 
        theta: .8, 
        alpha: .1,
*/
        width: 960,
        height: 500
      };
      var realargs = {};
      if (this.currentargs) {
        elation.utils.merge(this.currentargs, realargs);
      } else {
        elation.utils.merge(defaults, realargs);
      }
      elation.utils.merge(graphargs, realargs);
      this.graph
/*
          .linkStrength(realargs.linkStrength)
          .linkDistance(realargs.linkDistance)
          .friction(realargs.friction)
          .distance(realargs.distance)
          .charge(realargs.charge)
          .chargeDistance(realargs.chargeDistance)
          .gravity(realargs.gravity)
          .theta(realargs.theta)
          .alpha(realargs.alpha)
*/
          .gravity(.05)
          .friction(.6)
          .charge(-240)
          .alpha(.9)
          //.chargeDistance(1000)
          .size([realargs.width, realargs.height])

      console.log('REAL ARGS:', realargs);

      this.currentargs = realargs;
      this.refresh();
    }

    this.render = function() {
      this.graphroot.attr("transform", "translate(" + this.translate + ") scale(" + this.scale + ")");
      //this.graph.resume();
      this.graph.start();
      this.graph.tick();
      this.graph.stop();
    }

    this.update = function(data, links) {
      if (links === undefined) {
        var nodedata = this.flatten(data),
            nodes = nodedata[0],
            links = nodedata[1];
      } else {
        var nodes = data;
      }

      this.graph
          .nodes(nodes)
          .links(links);
      this.graph.start();

      this.drag = this.graph.drag()
            .on("dragstart", function(n) { n.fixed = true; this.dragging = true; this.dragmoved = false; }.bind(this))
            .on("dragend", function(n) { n.fixed = true; this.dragging = false; }.bind(this));

      var link = this.graphroot.selectAll(".link"),
          node = this.graphroot.selectAll(".node");

      this.node = node = node.data(nodes, function(d) { return d.id; }).style("fill", this.color);
      // Exit any old nodes.
      node.exit().remove();

      // Enter any new nodes.
      var g = node.enter().append("g")
          .attr("class", "node")
          .attr("id", function(n) { return "node_" + n.id; });
      g.append("circle")
          .attr("cx", 0)//function(d) { return d.x; })
          .attr("cy", 0)//function(d) { return d.y; })
          //.attr("r", function(d) { return (Math.pow(d.children.length, 1)) / this.scale; }.bind(this))
          .attr("r", function(d) { return Math.pow(d.children.length + 2, .5) * 2; }.bind(this))
          .style("fill", this.color);

      var textfunc = this.graphargs.textfunc || function(d) { return d.name; };

      g.append("text")
          .attr("font-size", function(d) { var size = (Math.pow(d.children.length + 1, .25)) * 4; return size + "px"; })
          //.attr("dx", "-3em")
          .attr("dy", "1em")
          .text(textfunc);

      //g.call(this.drag);

      // move node to the end of the dom list when it's moused over, for proper z-indexing
      this.node.on("mouseover", function(n) { if (!this.dragging) { n.hover = true; n.fixed = true; var g = document.getElementById('node_' + n.id); g.parentNode.appendChild(g); } this.refresh(); }.bind(this))
               .on("mousemove", function(n) { if (this.dragging) this.dragmoved = true; }.bind(this))
               .on("mouseout", function(n) { n.hover = false; if (!this.dragging) { n.fixed = n.selected || true; } this.refresh(); }.bind(this))
               .on("click", function(n) { if (!this.dragging && !this.dragmoved) { elation.events.fire({type: 'node_select', element: n}); } }.bind(this));
      this.groups = g;

      // Update the links…
      this.link = link = link.data(links, function(d) { return d.source.id + "_" + d.target.id; });

      // Exit any old links.
      link.exit().remove();

      // Enter any new links.
      link.enter().insert("line", ".node")
          .attr("class", "link")

      this.circles = this.node.select("circle");
      this.texts = this.node.select("text");
      // Pre-run the graph 20 ticks
      var preticks = this.graphargs.preticks || 20;
      for (var i = 0; i < preticks; i++) {
        this.graph.tick();
      }
      this.graph.on("tick", elation.bind(this, this.tick));

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
            try { 
              recurse(n);
            } catch (e) {
              console.log('ERROR hacking too much time', n);
              return;
            }
          });
        }
        if (!node.id) node.id = ++i;
        if (!toplevel) nodes.push(node);
      }

      recurse(root, true);
      console.log('node is', root);
      return [nodes, links];
    }

    this.handlezoom = function() {
      if (!this.dragging) {
        this.scale = d3.event.scale;
        this.translate = d3.event.translate;
        this.refresh();
        //this.graph.resume();
      } else {
        this.zoom.translate(this.translate);
        this.zoom.scale(this.scale);
        this.refresh();
      }
    }
    this.setsize = function(size) {
      this.width = size[0];
      this.height = size[1];

      this.graph.size(size);

      this.svg.attr("width", size[0])
              .attr("height", size[1]);
    }
  }, elation.ui.base);
});
