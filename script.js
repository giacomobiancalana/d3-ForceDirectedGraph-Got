// Define the dimensions of the visualization. 
var margin  = {top: 10, right: 5, bottom: 10, left: 100},
    width   = 1400-margin.left-margin.right,
    height  = 1100-margin.top-margin.bottom;   
//SVG container
var svg = d3.select("body").append("svg")
  .attr("id", "svgId")
  .attr("width",width)
  .attr("height",height);

//create the tooltip that holds the character name
var tooltip = d3.select('body').append('div') .attr("class","tooltip");

var nodes = new Array();
var links = new Array();
var nodesXml;
var linksXml;

d3.xml("./got-graph.graphml.xml").then(function(data){ 
  // Extract the nodes and links from the data.
  // nodesXml = d3.select(data).selectAll("node"); //è una prova
  nodesXml = data.getElementsByTagName("node");
  for (i = 0; i<nodesXml.length; i++) {
    var status = data.querySelectorAll('data[key="status"]')[i].textContent;
    var name = data.querySelectorAll('data[key="name"]')[i].textContent;
    var id = nodesXml[i].getAttribute("id");

    var n = {'id': id,'name': name, 'status': status};

    var nodesData = nodesXml[i].getElementsByTagName("data");
    for (j=0; j<nodesData.length; j++){
      if (nodesData[j].getAttribute("key") == 'house-birth'){
        n['house-birth'] = nodesData[j].textContent;
      }
    }
    for (j=0; j<nodesData.length; j++){
      if (nodesData[j].getAttribute("key") == 'house-marriage'){
        n['house-marriage'] = nodesData[j].textContent;
      }
    }
    for (j=0; j<nodesData.length; j++){
      if (nodesData[j].getAttribute("key") == 'group'){
        n['group'] = nodesData[j].textContent;
      }
    }
    nodes.push(n);
  }

  // ottengo graph con parentNode 
  //nodes = nodes[0].parentNode;


  // linksXml sono tutti i vari <edge> del file xml,
  // mentre linksData sono i vari <data> all'interno degli <edge>
  linksXml = data.getElementsByTagName("edge");
  for (i = 0; i<linksXml.length; i++) {
    var source = linksXml[i].getAttribute("source");
    source = parseInt(source);
    var target = linksXml[i].getAttribute("target");
    target = parseInt(target);
    var linksData = linksXml[i].getElementsByTagName("data");
    var e = {"source": source, "target": target};
    if (linksXml[i].getAttribute("directed") == "false") {
      e["directed"] = "false";
    }
    
    for (j=0; j<linksData.length; j++) {
      if (linksData[j].getAttribute("key") == "relation") {
        e["relation"] = linksData[j].textContent;
      }
    }
    for (j=0; j<linksData.length; j++) {
      if (linksData[j].getAttribute("key") == "type") {
        e["type"] = linksData[j].textContent;
      }
    }
    links.push(e);
  }

  // Force layout
  var force = d3.forceSimulation(nodes) //d3.values(nodes) è lo stesso qua
    .force("charge", d3.forceManyBody().strength(-100))
		.force("link", d3.forceLink(links)) //.strength(0)
    .force("center", d3.forceCenter($("#svgId").width() / 2, $("#svgId").height() / 2))
    // .charge([-600]) // inizio era [-600]
    // .chargeDistance(4000) // inizio era 400
    // .nodes(d3.values(nodes)) 
    // .links(links)
    .on("tick",tick)
    // .linkDistance(100)
    // .start();
  
// Next we'll add the nodes and links to the visualization.
// Note that we're just sticking them into the SVG container
// at this point. We start with the links. The order here is
// important because we want the nodes to appear "on top of"
// the links. SVG doesn't really have a convenient equivalent
// to HTML's `z-index`; instead it relies on the order of the
// elements in the markup. By adding the nodes _after_ the
// links, we ensure that nodes appear on top of links.

// Links are pretty simple. They're just SVG lines, and
// we're not even going to specify their coordinates. (We'll
// let the force layout take care of that.) Without any
// coordinates, the lines won't even be visible, but the
// markup will be sitting inside the SVG container ready
// and waiting for the force layout.
var container = svg.append("g");

  var link = container
          .selectAll('.link')
          .data(links)
          .enter().append('line')
          .attr("class","link");

  var node = container
          .attr("class", "node")
          .selectAll("circle")
          .data(nodes)
          .enter().append("circle")
          .attr("r", 10)
          .attr("name", d => d.name)
          .attr("fill", function(d) {
            return "red";
          })
          // .on('mouseover', console.log("provaaaaa"))
          .on('mouseover', mouseoverHandler)
          .on("mousemove",mouseMoving)
          .on("mouseout", mouseoutHandler);

  
  function tick(e){
     node.attr("cx", function(d) {  return d.x; })
     .attr("cy", function(d) {   return d.y; })
    //  .call(force.drag);
  
    link.attr('x1', function(d){ return  d.source.x})
        .attr('y1',function(d){ return  d.source.y})
        .attr('x2', function(d){ return  d.target.x})
        .attr('y2',function(d){ return   d.target.y})
  }
  
  //DRAG 
  node.call(
    d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
  );

  function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();
    if (!d3.event.active) force.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

function dragended(d) {
    if (!d3.event.active) force.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  //FINE DRAG
  
  var adjlist = [];
  function neigh(a, b) {
    return a == b || adjlist[a + "-" + b];
  }

  var labelNode = container.append("g").attr("class", "labelNodes")
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .text(function(d, i) { return i % 2 == 0 ? "" : d.id; })
    .style("fill", "#555")
    .style("font-family", "Arial")
    .style("font-size", 12)
    .style("pointer-events", "none"); // to prevent mouseover/drag capture

  //the tooltip with the name of the character is going to show up
  function mouseoverHandler (d) {
     tooltip.transition().style('opacity', .9)
     tooltip.html('<p>' + d["name"] + '</p>' );

     var index = d3.select(d3.event.target).datum().index;
    node.style("opacity", function(o) {
        return neigh(index, o.index) ? 1 : 0.1;
    });
    labelNode.attr("display", function(o) {
      return neigh(index, o.id.index) ? "block": "none";
    });
    link.style("opacity", function(o) {
        return o.source.index == index || o.target.index == index ? 1 : 0.1;
    });
  }

  //leaving a flag
  //the tooltip will disappear
  function mouseoutHandler (d) {
      tooltip.transition().style('opacity', 0);
      labelNode.attr("display", "block");
      node.style("opacity", 1);
      link.style("opacity", 1);
  }

  function mouseMoving (d) {
      tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px").style("color","white");
  }

  
  /*node.on("mouseover", focus).on("mouseout", unfocus);
  function focus(d) {
    var index = d3.select(d3.event.target).datum().index;
    node.style("opacity", function(o) {
        return neigh(index, o.index) ? 1 : 0.1;
    });
    labelNode.attr("display", function(o) {
      return neigh(index, o.node.index) ? "block": "none";
    });
    link.style("opacity", function(o) {
        return o.source.index == index || o.target.index == index ? 1 : 0.1;
    });
}

function unfocus() {
   labelNode.attr("display", "block");
   node.style("opacity", 1);
   link.style("opacity", 1);
}*/
})