elation.require(['ui.base', 'engine.engine', 'engine.things.player', 'engine.things.light_directional', 'physics.cyclone'], function() {
  /*
    force3d.nodes(nodes);
    force3d.links(links);
    force3d.config({
      x: 'position.x',
      y: 'position.y',
      z: 'position.z',
    });
  */
  elation.component.add('graph.force3d', function() {
    this.init = function() {
console.time('force3d_init');
      this.physics = new elation.physics.system();
      this.nodecache = [];
      this.linkcache = [];
      this.nodelist = [];
      this.linklist = [];
      this.lasttick = new Date().getTime();
      this.elapsed = 0;
      this.steptime = 1;
      this.staticgraph = ENV_IS_BROWSER;

      this.physics.active = !this.staticgraph;

      this.update();

      this.tick();
console.timeEnd('force3d_init');
    }
    this.nodes = function(nodes) {
      this.nodelist = nodes;
      this.update();
    }
    this.links = function(links) {
      this.linklist = links;
      this.update();
    }
    this.randomInCube = function() {
      return Math.random() * 10 - 5;
    }
    this.update = function() {
console.time('force3d_update');
      var num = Math.min(this.nodelist.length, Infinity);
      var nodemap = {};
      for (var i = 0; i < num; i++) {
        var node = this.nodelist[i];
        if (!node.position) { 
          node.position = new THREE.Vector3(node.x || this.randomInCube(), node.y || this.randomInCube(), node.z || this.randomInCube()); 
        }
        if (!this.nodecache[i]) {
          this.nodecache[i] = new elation.graph.force3d.node(node.position, this.staticgraph);
          if (!this.staticgraph) {
            this.physics.add(this.nodecache[i].dynamics);
          }
        } else {
          this.nodecache[i].setPosition(node.position);
        }
        nodemap[node.url] = this.nodecache[i];;
      }

      for (var i = 0; i < this.linklist.length; i++) {
        var link = this.linklist[i];
        var srcnode = nodemap[link.url],
            dstnode = nodemap[link.link];
        if (srcnode && dstnode) {
          srcnode.addLink(dstnode);
        }
      }

      elation.events.fire({type: 'graph_update', element: this});
console.timeEnd('force3d_update');
    }
    this.tick = function() {
      var now = new Date().getTime();
      var diff = this.steptime; //now - this.lasttick;
      this.elapsed += diff / 1000;
      if (!this.staticgraph) {
console.time('force3d_physics_step');
        this.physics.step(diff / 1000);
console.timeEnd('force3d_physics_step');
      }
      this.lasttick = now;
      elation.events.fire({type: 'graph_tick', element: this, data: diff });
      //if (!this.staticgraph) {
        setTimeout(elation.bind(this, this.tick), 16);
      //}
    }
    this.jiggle = function(amount) {
      if (!amount) amount = 1;
      console.log('jiggle'); 
      this.physics.children.forEach(function(n) {
        n.setVelocity({x: Math.random() * amount - amount/2, y: Math.random() * amount - amount/2, z: Math.random() * amount - amount/2});
      });
    }
  }, elation.ui.base);
  elation.extend('graph.force3d.node', function(position, staticgraph) {
    this.position = position || new THREE.Vector3();
    this.staticgraph = staticgraph;
    if (!this.staticgraph) {
      this.dynamics = new elation.physics.rigidbody({position: this.position, mass: 1});
      this.dynamics.setDamping(0.2);
      this.dynamics.addForce('electrostatic', { charge: 30 });
    }

    this.setPosition = function(pos) {
      //this.position.copy(pos)
      this.position = pos;
    }
    this.addLink = function(node) {
      if (this.staticgraph) return;
      var found = false;
      var forces = this.dynamics.getForces('spring');
      for (var i = 0; i < forces.length; i++) {
        if (forces[i].other == node.dynamics) {
          found = true;
        }
      }
      if (!found) {
          this.dynamics.addForce('spring', { other: node.dynamics, strength: 2 });
          node.dynamics.addForce('spring', { other: this.dynamics, strength: 2 });
      }
    }
  });
  elation.extend('graph.force3d.link', function() {
  });
  elation.component.add('graph.force3d.viewer', function() {
    this.initEngine = function() {
      var hashargs = elation.url();
       
      this.enginecfg.systems = [];
      this.enginecfg.systems.push("physics");
      this.enginecfg.systems.push("world");
      //this.enginecfg.systems.push("ai");
      if (hashargs.admin == 1) {
        this.enginecfg.systems.push("admin");
      } 
      this.enginecfg.systems.push("render");
      this.enginecfg.systems.push("sound");
      this.enginecfg.systems.push("controls");
    }
    this.initWorld = function() {
      var world = {
        type: 'generic',
        name: 'default',
        things: {
          'sun': {
            type: 'light_directional',
            properties: {
              type: 'directional',
              position: [-5, 12, 8]
            }
          },
          'player': {
            name: 'player',
            type: 'player',
            properties: {
              mass: 10.0,
              movespeed: 200,
              runspeed: 400,
            }
          },
          'graphcontainer': {
            type: 'generic',
            name: 'graphcontainer',
            properties: {
              position: [0, 0, -10],
              //angular: [0, 2 * Math.PI / 200, 0],
              //search: this
            },
            things: {
              'graph': {
                type: 'graph_force3d_viewer',
                name: 'graph',
                properties: {
                  position: [-5, -2.5, -5],
                  nodes: this.nodes,
                  links: this.links,
                  //search: this
                }
              }
            }
          }
        }
      };
      var things = this.engine.systems.world.load(world);
      this.player = things.children.default.children.player;
      this.graphobject = things.children.default.children.graphcontainer.children.graph;
    }
    this.setGraph = function(graph) {
      if (this.graph && this.graph !== graph) {
        this.clearGraph();
      }
      if (this.graph !== graph) {
        this.graph = graph;
        elation.events.add(this.graph, 'graph_update,graph_tick', this);
      } else {
        this.update();
      }
    }
    this.clearGraph = function() {
      elation.events.remove(this.graph, 'graph_update,graph_tick', this);
    }
    this.update = function() {
      if (this.graphthing) {
if (!this.updated) {
        this.graphthing.setData(this.graph.nodelist, this.graph.linklist);
        this.updated = true;
}
      } else {
        this.graphthing = elation.engine.things.graph_force3d_viewer('graph');
        setTimeout(elation.bind(this, this.update), 100);
//console.log('try again', this.graphthing);
      }
    }
    this.graph_update = function() {
      this.update();
    }
    this.graph_tick = function() {
      this.update();
    }
  }, elation.engine.client);
  elation.component.add('engine.things.graph_force3d_viewer', function() {
    this.postinit = function() {
      this.defineProperties({
        'nodes': { type: 'object' },
        'links': { type: 'object' },
        'search': { type: 'object' }
      });
    }
    this.createObject3D = function() {
      return new THREE.Object3D();
    }
    this.setData = function(nodes, links) {
      //console.log('NEW GRAPH DATA', nodes, links);
      var geo = this.geometry;
      if (!geo || geo.attributes.position.count != nodes.length) {
console.log('new geo');
        if (this.points) this.objects['3d'].remove(this.points);
        this.pointmap = {};

        geo = this.geometry = new THREE.BufferGeometry();
        var positions = new Float32Array( nodes.length * 3 );
        var colors = new Float32Array( nodes.length * 3 );
        geo.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
        geo.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

        geo.attributes.color.dynamic = true;

        var mat = new THREE.PointsMaterial({color: 0xffffff, size: 0.475, vertexColors: true, transparent: true, opacity: .95, alphaTest: .2});
        var obj = new THREE.Points(geo, mat);
        this.points = obj;
        this.objects['3d'].add(obj);
console.log('new graph node geo', nodes.length, geo.attributes.position.count);
      } else {
        var positions = geo.attributes.position;
        var colors = geo.attributes.color;
      }

      this.urlmap = {};
      var color = new THREE.Color();
      var changed = false;
      for (var i = 0; i < nodes.length; i++) {
        var room = nodes[i];
        if (room) {
          this.urlmap[room.url] = room;
          this.pointmap[room.id] = i;
          var pos = new THREE.Vector3(room.x / 10, room.y / 10, room.z / 10);
          //var pos = new THREE.Vector3(room.x / 10, room.y / 10, room.z / 10);
          room.position = pos;
          if (!room.position) {
console.log('new position??', room);
            room.position = new THREE.Vector3(elation.utils.any(room.x, i * 2), elation.utils.any(room.y, Math.random() * 2 - 1), elation.utils.any(room.z, Math.random() * 2 - 1)); 
          }
          //var color = new THREE.Color(parseInt(room.color, 16));
          //var color = new THREE.Color(0xff0000);
          color.setHex(parseInt(room.color, 16));
          //geo.vertices[i] = room.position;
          //geo.colors[i] = color;
          var pos = room.position.toArray();
          var idx = i * 3;
          if (pos[0] != positions[idx] || pos[1] != positions[idx + 1] || pos[2] != positions[idx + 2]) {
            positions[i * 3] = room.position.x;
            positions[i * 3 + 1] = room.position.y;
            positions[i * 3 + 2] = room.position.z;

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            changed = true;
          }
        }
      }
      //console.log('yay it is the buffergeometry', positions, colors);
      if (changed) {
        geo.verticesNeedUpdate = true;
        geo.computeBoundingSphere();
console.log('did a change');
      }

      var linkverts = [];
      for (var i = 0, j = 0; i < links.length; i++) {
        var src = this.urlmap[links[i].url],
            dst = this.urlmap[links[i].link];
        if (src && dst) {
          linkverts[j * 2] = src.position;
          linkverts[j * 2 + 1] = dst.position;
          j++;
        }
      }
      var linegeo = this.linegeometry;
      if (!linegeo || linegeo.vertices.length != linkverts.length) {
        if (this.lines) { 
          this.objects['3d'].remove(this.lines);
        }
        var linegeo = new THREE.Geometry();
        var linemat = new THREE.LineBasicMaterial({color: 0xcccccc, transparent: true, opacity: 0.1, alphaTest: 0.1});

        var lineobj = new THREE.LineSegments(linegeo, linemat);
        this.objects['3d'].add(lineobj);

        this.linegeometry = linegeo;
        this.lines = lineobj;
        linegeo.vertices = linkverts;
console.log('new graph link geo');
      }

      linegeo.verticesNeedUpdate = true;
      linegeo.computeBoundingSphere();
      this.refresh();
    }
  }, elation.engine.things.generic);
});
