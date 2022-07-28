// Define the dimensions of the visualization. 
var width   = 1750;
var height  = 1000;  
var color = d3.scaleOrdinal(d3.schemeCategory10); //aggiunta variabile per il colore
//SVG container
var svg = d3.select(".container").append("div").attr("class", "graph").append("svg")
.attr("id", "svgId")
.attr("width",width)
.attr("height",height);

//create the tooltip that holds the character name
var tooltip = d3.select('body').select(".graph").append('div') .attr("class","tooltip");

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
  
  //aggiunta alex
  var cHouse=  0;
  
  //fino qu

  var nodesData = nodesXml[i].getElementsByTagName("data");
  for (j=0; j<nodesData.length; j++){
    if (nodesData[j].getAttribute("key") == 'house-birth'){
      n['house-birth'] = nodesData[j].textContent; 
      //aggiunta ALEx
      if(n['house-birth' == 'House Arryn'])
       cHouse++;
       //fino qui
      
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
svg.call(
  d3.zoom()
      .scaleExtent([.1, 4])
      .on("zoom", function() { container.attr("transform", d3.event.transform); })
);
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
          if ( color(d["house-birth"]) == null) {
            console.log(1);
          } else return color(d["house-birth"]); //colore in base all'attributo specificato
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
links.forEach(function(d) {
  adjlist[d.source.index + "-" + d.target.index] = true;
  adjlist[d.target.index + "-" + d.source.index] = true;
});

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


  var neighborLinkS = new Array();
  var neighborLinkT = new Array();


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
  var currentID = d["id"];
  
  for (i = 0; i < links.length; i++){
    if (links[i]["source"]["id"] == currentID){
      neighborLinkS.push(links[i]);
    } else if (links[i]["target"]["id"] == currentID){
      neighborLinkT.push(links[i]);
    }

  }
  
  
  //console.log(neighborLinkS);
  var info = d3.select(".container").append("div").attr("class", "relation_info").append("div");
  info.append("p").attr("class", "info").text("Status: "+d["status"]);
  var info2 = d3.select(".container").select(".relation_info").append("div");
  var relation;
  var targetN;
  var sourceN;
  var type;
  //source links
  info2.selectAll("p").data(neighborLinkS).enter().append("p").attr("class", "neighborinfo").text(function(j){
    relation = j["relation"];
    targetN = j["target"]["name"];
    type = j["type"];
    if(relation == "sibling" || relation == "father" || relation == "mother"){
      return (type+" "+relation+" of "+targetN);
    } else if (relation == "lover" || relation == "spouse"){
      return (relation+" of "+targetN);
    } else if (relation == "killed"){
      return (relation+" "+targetN);
    } else if (type == "pledge" || type == "oath"){
      return (type+" to "+targetN);
    } else {
      return (type+" of "+targetN);
    }  

    
  });
  //target links
  info2.selectAll("p").data(neighborLinkT).enter().append("p").attr("class", "neighborinfo").text(function(j){
    relation = j["relation"];
    sourceN = j["source"]["name"];
    type = j["type"];
    if(relation == "killed"){
      return ("killed by "+sourceN);
    } else if (relation == "sibling" || relation == "spouse" || relation == "lover"){
      return (relation+" of "+sourceN);
    } else if (relation == "father" || relation == "mother"){
      return ("child of "+sourceN);
    } else if (type == "pledge" || type == "oath"){
      return (sourceN+" made a "+type+" to them");
    } else {
      return (sourceN+" is their "+type);
    }
  })

  
}

//aggiunta alex
var colorList = {Baratheon: 'rgb(231,0,0)', Arryn: 'rgb(0,117,183)',
Stark: 'rgb(255,113,0)', Bolton: 'rgb(147,80,71)', Greyjoy: 'rgb(159,86,190)', Reed: 'rgb(0, 191, 255)',
Lannister: 'rgb(228,87,181)', Mormont: 'rgb(127,127,127)', Martell: 'rgb(183, 196, 0)',None: 'rgb(0,170,44)'
};
              
colorize = function(colorList) {
    var container = document.getElementById('legend');
  
    for (var key in colorList) {
        var boxContainer = document.createElement("DIV");
        var box = document.createElement("DIV");
        var label = document.createElement("SPAN");

        label.innerHTML = " "+key;
        box.className = "box";
        box.style.backgroundColor = colorList[key];

        boxContainer.appendChild(box);
        boxContainer.appendChild(label);

        container.appendChild(boxContainer);

   }
}

colorize(colorList);
//fino qui

//leaving a flag
//the tooltip will disappear
function mouseoutHandler (d) {
    tooltip.transition().style('opacity', 0);
    labelNode.attr("display", "block");
    node.style("opacity", 1);
    link.style("opacity", 1);
    d3.select(".relation_info").remove();
    neighborLinkS.length = 0;
    neighborLinkT.length = 0;

}

function mouseMoving (d) {
    tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px").style("color","white");
}



//console.log(node["_groups"]);
//console.log(typeof(node["_groups"]));
//console.log(links[67]["source"]["id"]);

});

