// Define the dimensions of the visualization. 
var width   = 1750;
var height  = 1000;  
var color = d3.scaleOrdinal().range(['#9a6324', '#3cb44b', '#e6c700', '#4363d8', '#d76b00', 
'#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#f2acb9', '#469990', '#e6194b', '#800000',
'#808000', '#000075', '#6f7378']); //add color variable
//SVG container
var svg = d3.select(".htmlcontainer").append("div").attr("class", "graph").append("svg")
.attr("id", "svgId")
.attr("width",width)
.attr("height",height);

//create the label that holds the character name
var tooltip = d3.select('body').select(".graph").append('div') .attr("class","tooltip");

var nodes = new Array();
var links = new Array();
var nodesXml;
var linksXml;
var linksData;


d3.xml("./got-graph.graphml.xml").then(function(data){ 
// Extract the nodes and links from the data.
nodesXml = data.getElementsByTagName("node"); //grab content from every "node" tag
for (i = 0; i<nodesXml.length; i++) {
  // extract the attribute key from data tags if key = status
  var status = data.querySelectorAll('data[key="status"]')[i].textContent;
  // extract the attribute key from data tags if key = name
  var name = data.querySelectorAll('data[key="name"]')[i].textContent;
  var id = nodesXml[i].getAttribute("id");
  var n = {'id': id,'name': name, 'status': status};
  
  var nodesData = nodesXml[i].getElementsByTagName("data"); //collect every data tag
  //add optional features for each node
  for (j=0; j<nodesData.length; j++){
    if (nodesData[j].getAttribute("key") == 'house-birth'){
      n['house-birth'] = nodesData[j].textContent;   
    }
    if (nodesData[j].getAttribute("key") == 'house-marriage'){
      n['house-marriage'] = nodesData[j].textContent;
    }
    if (nodesData[j].getAttribute("key") == 'group'){
      n['group'] = nodesData[j].textContent;
    }
  
  }
  
  nodes.push(n);

}

//set house birth to NONE for characters without house birth
for (k = 0; k < nodes.length; k++){
  if (nodes[k]['house-birth'] == null){
    nodes[k]['house-birth'] = "None";
  }
}

/*console.log(nodesData.length);
console.log(nodesXml);
console.log(nodesData);*/

var houses = new Array();
for (k = 0; k < nodes.length; k++){
  houses.push(nodes[k]['house-birth']); 
}

//console.log(houses);

//housecount is a data structure that contains the number of occurrences for each house
var housecount = new Map();
for (k = 0; k < nodes.length; k++){
  var currentHouse = nodes[k]['house-birth'];
  var count = housecount.get(currentHouse);
  housecount.set(currentHouse, isNaN(count) ? 1 : ++count);
}

//console.log(housecount);

//the array otherHouses stores the list of houses with a single occurrence. These houses will merge
//in the "Other" category.
var otherHouses = new Array();
housecount.forEach((value, key) => {
  if(value == 1){
    otherHouses.push(key);
  }
})

//console.log(otherHouses);

for (k = 0; k < otherHouses.length; k++){
  for (j = 0; j < nodes.length; j++){
    if (otherHouses[k] == nodes[j]['house-birth']){
      nodes[j]['house-birth'] = "Other";
    }
  }
}

//console.log(nodes);

// linksXml stores all edge tag elements from the xml file
// linksData stores data tags that lie inside edge tags
linksXml = data.getElementsByTagName("edge");
for (i = 0; i<linksXml.length; i++) {
  var source = linksXml[i].getAttribute("source");
  source = parseInt(source);
  var target = linksXml[i].getAttribute("target");
  target = parseInt(target);
  linksData = linksXml[i].getElementsByTagName("data");
  var e = {"source": source, "target": target};
  if (linksXml[i].getAttribute("directed") == "false") {
    e["directed"] = "false";
  }
  
  for (j=0; j<linksData.length; j++) { 
    if (linksData[j].getAttribute("key") == "relation") {
      e["relation"] = linksData[j].textContent;
    }
    if (linksData[j].getAttribute("key") == "type") {
      e["type"] = linksData[j].textContent;
    }
  }
  links.push(e);
}

// Force layout
var force = d3.forceSimulation(nodes) 
  .force("charge", d3.forceManyBody().strength(-100))
  .force("link", d3.forceLink(links).strength(0.28))
  .force("center", d3.forceCenter($("#svgId").width() / 2.3, $("#svgId").height() / 2.7))
  .on("tick",tick)

// Next we'll add the nodes and links to the visualization.
// Note that we're just sticking them into the SVG container
// at this point. We start with the links. The order here is
// important because we want the nodes to appear "on top of"
// the links. SVG relies on the order of the elements in the 
// markup. By adding the nodes after the links, we ensure
// that nodes appear on top of links.

var container = svg.append("g"); //container of svg elements
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
          } else return color(d["house-birth"]); //colore in base all'attributo specificato CONTROLLA
        })
        .on('mouseover', mouseoverHandler)
        .on("mousemove",mouseMoving)
        .on("mouseout", mouseoutHandler);

//to update the location of circles and lines at each step of the simulation
function tick(){
   node.attr("cx", function(d) { return d.x; })
   .attr("cy", function(d) { return d.y; })

   link.attr('x1', function(d){ return d.source.x; })
  .attr('y1',function(d){ return d.source.y; })
  .attr('x2', function(d){ return d.target.x; })
  .attr('y2',function(d){ return d.target.y; })
}

//DRAG 
node.call(
  d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
);

function dragstarted(d) {
  d3.event.sourceEvent.stopPropagation(); //prevents the parent tag from moving
  if (!d3.event.active) force.alphaTarget(0.6).restart();
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

//console.log(adjlist);

function neighbor(a, b) {
  return a == b || adjlist[a + "-" + b];
}

var neighborLinkS = new Array();
var neighborLinkT = new Array();

//the tooltip with the name of the character is going to show up
function mouseoverHandler (d) {
  tooltip.transition().style('opacity', .9)
  tooltip.html('<p>' + d["name"] + '</p>' );

  var index = d3.select(d3.event.target).datum().index;
  node.style("opacity", function(o) {
    return neighbor(index, o.index) ? 1 : 0.1;
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
  var status_info = d3.select(".htmlcontainer").append("div").attr("class", "relation_info").append("div");
  status_info.append("p").attr("class", "info").text("Status: "+d["status"]);
  var other_info = d3.select(".htmlcontainer").select(".relation_info").append("div");
  var relation;
  var targetN;
  var sourceN;
  var type;
  //source links
  other_info.selectAll("p").data(neighborLinkS).enter().append("p").attr("class", "neighborinfo").text(function(j){
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
  other_info.selectAll("p").data(neighborLinkT).enter().append("p").attr("class", "neighborinfo").text(function(j){
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

var colorList = {Arryn: '#9a6324', Baratheon: '#4363d8', Bolton: '#000075', Clegane: '#3cb44b',
Greyjoy: '#d76b00', Lannister: '#42d4f4', Martell: '#6f7378', Mormont: '#f032e6', Payne: '#bfef45',
Reed: '#f2acb9', Sand: '#469990', Stark: '#e6194b', Targaryen: '#911eb4', Tully: '#808000', 
Other: '#800000', None: '#e6c700'};
              
colorize = function(colorList) {
    var container = document.getElementById('legend');
  
    for (var key in colorList) {
        var boxContainer = document.createElement("div");
        var box = document.createElement("div");
        var label = document.createElement("span");

        label.innerHTML = " "+key;
        box.className = "box";
        box.style.backgroundColor = colorList[key];

        boxContainer.appendChild(box);
        boxContainer.appendChild(label);

        container.appendChild(boxContainer);

   }
}

colorize(colorList);

function mouseoutHandler () {
    tooltip.transition().style('opacity', 0);
    //labelNode.attr("display", "block");
    node.style("opacity", 1);
    link.style("opacity", 1);
    d3.select(".relation_info").remove();
    neighborLinkS.length = 0;
    neighborLinkT.length = 0;
}

function mouseMoving () {
    tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px").style("color","white");
}

//console.log(node["_groups"]);
//console.log(typeof(node["_groups"]));
//console.log(links[67]["source"]["id"]);

});

