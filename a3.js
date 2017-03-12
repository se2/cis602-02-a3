var drawLegend = function(svg, data, color) {
	var radius = 10,
	    fontSize = 12;

	var legend = svg.append("g")
	                    .attr("class", "legend")
	                    .selectAll("g")
	                    .data(data)
	                    .enter().append("g")
	                        .attr("class", function(d) { return d; })
	                        .attr("transform", function(d, i) { return "translate(0," + (i * (radius + 1) * 2) + ")"; });

	legend.append("text")
	        .attr("font-size", fontSize)
	        .attr("x", radius * 2.5)
	        .attr("y", radius * 1.5)
	        .text(function(d) { return d; });

	legend.append("circle")
	        .attr("cx", radius)
	        .attr("cy", radius)
	        .attr("r", radius)
	        .attr("fill", color);
}

var drawMap = function(mapData, data, key, htmlID) {

	var width = 1000,
	    height = 500,
	    scale = 160;

	/* draw svg and g elements */
	var svg = d3.select(htmlID)
			    .append("svg")
			    .attr("width", width)
			    .attr("height", height);

	var color = d3.scaleSequential(d3.interpolateReds);

	/* map projection */
	var projection = d3.geoRobinson()
					.scale(scale);

	var path = d3.geoPath()
	    		.projection(projection);

	var playersCount = _.countBy(data, key);

	var maxCount = Math.max.apply(null, Object.keys(playersCount).map(function(key) { return playersCount[key]; }));

	/* append to svg */
	svg.append("g")
	    .selectAll("path")
	    .data(mapData.features)
	    .enter().append("path")
		    .attr("fill", function(d) {
		        return (playersCount[d.properties.name] == undefined) ? "#fff" : color(playersCount[d.properties.name] / maxCount); })
		    .attr("d", path)
		    .attr("stroke", "#000")
			.attr("stroke-width", 0.5)
		    .attr("class", function(d) { return d.id })
		    .append("title")
		    	.text(function(d) {
		        	return (playersCount[d.properties.name] == undefined) ? "" : d.properties.name + ": " + playersCount[d.properties.name];
		    	});
}

var forceSimulation = function(teammateData, mensData, htmlID) {

	/* prepare data */
	nodes = [];
	links = [];

	/* return top 9 nationalities with most players */
	nationalities = _.map(_.countBy(mensData, "Nationality"), function(value, key) { return { key: key, value: value }; });
	nationalities = _.map(_.chunk(_.reverse(_.sortBy(nationalities, "value")), 9)[0], "key");
	nationalities.push("Other");

	teammateData.map(function(d) {

		nationality1 = (_.filter(mensData, function(o) { return d[0] == o.Name; })[0]["Nationality"]);
		nationality2 = (_.filter(mensData, function(o) { return d[1] == o.Name; })[0]["Nationality"]);

		node1 = { "id": d[0], "nationality": (_.includes(nationalities, nationality1)) ? nationality1 : "Other" }
		node2 = { "id": d[1], "nationality": (_.includes(nationalities, nationality2)) ? nationality2 : "Other" }
		link  = { "source": d[0], "target": d[1] };

		links.push(link);
		nodes.push(node1);
		nodes.push(node2);

	});

	nodes = _.uniqBy(nodes, "id");

	teammateData = {
		"nodes": nodes,
		"links": links
	}

	/* draw simulation */
	var width = 1100,
	    height = 800,
	    nodes, links, nationalities;

	var svg = d3.select("body").append("svg")
	    .attr("width", width)
	    .attr("height", height);

	var color = d3.scaleOrdinal(d3.schemeCategory10);

	var simulation = d3.forceSimulation()
					.force("x", d3.forceX(200))
					.force("y", d3.forceY(200))
					.force("many", d3.forceManyBody())
					.force("link", d3.forceLink().id(function(d) { return d.id; }))
	    			.force("center", d3.forceCenter(width / 2, height / 2));

	simulation.force("many").strength(-200);
	simulation.force("link").distance(50);

	simulation
	    .nodes(teammateData.nodes);

	simulation
	    .force("link")
	    .links(teammateData.links);

	link = svg.selectAll(".link")
	    .data(teammateData.links)
	    .enter().append("line")
	    .attr("class", "link")
        .attr("stroke", "#7BA1C2")
				.attr("stroke-width", 1);;

	node = svg.selectAll(".node")
	    .data(teammateData.nodes)
	    .enter().append("g")
	    .attr("class", "node");

    node.append("circle")
		.attr("r", 10)
		.attr("fill", function(d) {
			return color(d.nationality); })
		.call(d3.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended));

	node.append("text")
	    .attr("dx", 12)
	    .attr("font-size", 10)
	    .attr("dy", ".35em")
	    .text(function(d) {
	        return d.id });

	simulation.on("tick", function() {
	    link.attr("x1", function(d) { return d.source.x; })
	        .attr("y1", function(d) { return d.source.y; })
	        .attr("x2", function(d) { return d.target.x; })
	        .attr("y2", function(d) { return d.target.y; });

	    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	});

	function dragstarted(d) {
	    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
	    d.fx = d.x;
	    d.fy = d.y;
	}

	function dragged(d) {
	    d.fx = d3.event.x;
	    d.fy = d3.event.y;
	}

	function dragended(d) {
	    if (!d3.event.active) simulation.alphaTarget(0);
	    d.fx = null;
	    d.fy = null;
	}

	/* legend of colors - nationalities */
	drawLegend(svg, nationalities, color);
}

function createVis(errors, mapData, womensData, mensData, teammateData) {

    if (errors) throw errors;

    drawMap(mapData, womensData, "Country", "#map-women");

    drawMap(mapData, mensData, "Nationality", "#map-men");

    forceSimulation(teammateData, mensData, "#teammates");
}

d3.queue().defer(d3.json, "https://cdn.rawgit.com/johan/world.geo.json/master/countries.geo.json")
    .defer(d3.json, "https://cdn.rawgit.com/dakoop/e4fa063e3f3415f3d3c79456bc4b6dc5/raw/a9e01691802c8e70d94ce33a59e98529cc4324af/fifa-17-women.json")
    .defer(d3.json, "https://cdn.rawgit.com/dakoop/e4fa063e3f3415f3d3c79456bc4b6dc5/raw/a9e01691802c8e70d94ce33a59e98529cc4324af/guardian-16-men.json")
    .defer(d3.json, "https://cdn.rawgit.com/dakoop/e4fa063e3f3415f3d3c79456bc4b6dc5/raw/a9e01691802c8e70d94ce33a59e98529cc4324af/soccer-teammates-men.json")
    .await(createVis);


