var drawLegend = function(svg, data, color, shape) {
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

	if ( shape == "circle" ) {
		legend.append(shape)
		        .attr("cx", radius)
		        .attr("cy", radius)
		        .attr("r", radius)
		        .attr("fill", color);
	} else if ( shape == "rect" ) {
		legend.append(shape)
				.attr("x", radius)
				.attr("y", radius)
				.attr("width", radius)
				.attr("height", radius)
				.attr("fill", color);
	}
}

var drawMap = function(mapData, data, key, htmlID) {

	var width = 1000,
	    height = 500,
	    scale = 175;

	/* draw svg and g elements */
	var svg = d3.select(htmlID)
			    .append("svg")
			    .attr("width", width)
			    .attr("height", height);

	var color = d3.scaleSequential(d3.interpolateReds);

	/* map projection */
	var projection = d3.geoNaturalEarth()
					.scale(scale);

	var path = d3.geoPath()
	    		.projection(projection);

	var playersCount = _.countBy(data, key);

	var maxCount = Math.max.apply(null, Object.keys(playersCount).map(function(key) { return playersCount[key]; }));

	svg.append("defs").append("path")
				    .datum({type: "Sphere"})
				    .attr("id", "sphere")
				    .attr("d", path);

	svg.append("use")
	    .attr("class", "bound")
	    .attr("xlink:href", "#sphere");

	/* append to svg */
	svg.append("g")
	    .selectAll("path")
	    .data(mapData.features)
	    .enter().append("path")
		    .attr("fill", function(d) {
		        return (_.isNil(playersCount[d.properties.name])) ? "#fff" : color(playersCount[d.properties.name] / maxCount); })
		    .attr("d", path)
		    .attr("stroke", "#000")
			.attr("stroke-width", 0.5)
		    .attr("class", function(d) { return d.id })
		    .append("title")
		    	.text(function(d) {
		        	return (_.isNil(playersCount[d.properties.name])) ? "" : d.properties.name + ": " + playersCount[d.properties.name];
		    	});
}

var forceSimulation = function(teammateData, mensData, htmlID) {

	/* prepare data */
	nodes = [];
	links = [];

	/* return top 9 nationalities with most players */
	nationalities = _.map(_.countBy(mensData, "Nationality"), function(value, key) { return { key: key, value: value }; });
	nationalities = _.map(_.chunk(_.orderBy(nationalities, ['value'], ['desc']), 9)[0], 'key');
	nationalities.push("Other");

	teammateData.map(function(names) {

		names.map(function(name, i) {
			nationality = (_.filter(mensData, function(o) { return name == o.Name; })[0]["Nationality"]);
			node = { "id": name, "nationality": (_.includes(nationalities, nationality)) ? nationality : "Other" }
			nodes.push(node);
		});

		link  = { "source": names[0], "target": names[1] };
		links.push(link);

	});

	nodes = _.uniqBy(nodes, "id");

	teammateData = {
		"nodes": nodes,
		"links": links
	}

    var container = document.getElementById("teammates");

	/* draw simulation */
	var width = container.clientWidth,
	    height = container.clientHeight,
	    nodes, links, nationalities;

	var svg = d3.select("#teammates").append("svg")
			    .attr("width", width)
			    .attr("height", height);

	var color = d3.scaleOrdinal(d3.schemeCategory10);

	var simulation = d3.forceSimulation()
					.force("many", d3.forceManyBody())
					.force("link", d3.forceLink().id(function(d) { return d.id; }))
	    			.force("center", d3.forceCenter(width / 2, height / 2));

	simulation.force("many").strength(-225);

	simulation.nodes(teammateData.nodes);

	simulation.force("link")
	    	.links(teammateData.links);

	link = svg.selectAll(".link")
		    .data(teammateData.links)
		    .enter().append("line")
	        .attr("stroke", "#7BA1C2")
			.attr("stroke-width", 0.75);

	node = svg.selectAll("g")
		    .data(teammateData.nodes)
		    .enter().append("g")

    node.append("circle")
		.attr("r", 10)
		.attr("fill", function(d) {
			return color(d.nationality); })
		.call(d3.drag()
			.on("start", dragstart)
			.on("drag", dragging)
			.on("end", dragend));

	node.append("title")
		.text(function(d) { return d.id });

	node.append("text")
	    .attr("dx", 12)
	    .attr("font-size", 11)
	    .attr("dy", ".35em")
	    .text(function(d) { return d.id; });

	simulation.on("tick", function() {
	    link.attr("x1", function(d) { return d.source.x; })
	        .attr("y1", function(d) { return d.source.y; })
	        .attr("x2", function(d) { return d.target.x; })
	        .attr("y2", function(d) { return d.target.y; });

	    node.select("circle").attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	    node.select("text").attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	});

	function dragstart(d) {
	    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
	    d.fx = d.x;
	    d.fy = d.y;
	}

	function dragging(d) {
	    d.fx = d3.event.x;
	    d.fy = d3.event.y;
	}

	function dragend(d) {
	    if (!d3.event.active) simulation.alphaTarget(0);
	    d.fx = null;
	    d.fy = null;
	}

	/* legend */
	drawLegend(svg, nationalities, color, "circle");
}

var barChart = function(mensData) {

    /* prepare data */
    /* trim each value to ensure result accuracy */
    _.each(mensData, o => _.each(o, (v, k) => o[k] = v.trim()));
	leagues 	= _.map(_.countBy(mensData, "League"), function(value, key) { return { key: key, value: value }; });
	positions 	= _.map(_.countBy(mensData, "Position"), function(value, key) { return { key: key, value: value }; });
	/* order data */
	leagues 	= _.orderBy(leagues, ['value'], ['desc']);
	positions 	= _.orderBy(positions, ['value'], ['desc']);

    var margin = {top: 40, right: 40, bottom: 40, left: 40},
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom,
        radius = Math.min(width, height) / 2;

	var color = d3.scaleOrdinal(d3.schemeCategory10);

    /* scale x and y */
    var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
        y = d3.scaleLinear().range([height, 0]);

    /* draw svg and g elements */
    var svg = d3.select("#extra")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                	.attr("transform", "translate(" + margin.left * 1.5 + "," + margin.left / 1.5 + ")");

    drawBarChart(svg, leagues, height, x, y);

}

var drawBarChart = function(svg, data, height, x, y) {

	/* domain data for x and y */
	x.domain(data.map(function(d) { return d.key; }));
	y.domain([0, d3.max(data, function(d) { return d.value * 1.2; })]);

	/* define x and y axes rules */
	var xAxis = d3.axisBottom(x);
	var yAxis = d3.axisLeft(y);

	/* draw bar chart */
	svg.selectAll("rect")
	        .data(data)
	        .enter().append("rect")
	        .attr("x", function(d) { return x(d.key); })
	        .attr("y", function(d) { return y(d.value); })
	        .attr("width", x.bandwidth())
	        .attr("height", function(d) { return height - y(d["value"]); })
	        .attr("fill", "#EB4838")
	        	.append("text")
	        	.text(function(d) { return d.value; });

	/* append x axis, transform it to bottom */
	svg.append("g")
	        .attr("transform", "translate(0," + height + ")")
	        .call(xAxis)

	/* append y axis */
	svg.append("g")
	        .call(yAxis);

}

function createVis(errors, mapData, womensData, mensData, teammateData) {

    if (errors) throw errors;

    /* Part 1 */
    drawMap(mapData, womensData, "Country", "#map-women");

    /* Part 2 */
    drawMap(mapData, mensData, "Nationality", "#map-men");

    /* Part 3 */
    forceSimulation(teammateData, mensData, "#teammates");

    /* Extra credit */
    barChart(mensData);

}

d3.queue().defer(d3.json, "https://cdn.rawgit.com/johan/world.geo.json/master/countries.geo.json")
    .defer(d3.json, "https://cdn.rawgit.com/dakoop/e4fa063e3f3415f3d3c79456bc4b6dc5/raw/a9e01691802c8e70d94ce33a59e98529cc4324af/fifa-17-women.json")
    .defer(d3.json, "https://cdn.rawgit.com/dakoop/e4fa063e3f3415f3d3c79456bc4b6dc5/raw/a9e01691802c8e70d94ce33a59e98529cc4324af/guardian-16-men.json")
    .defer(d3.json, "https://cdn.rawgit.com/dakoop/e4fa063e3f3415f3d3c79456bc4b6dc5/raw/a9e01691802c8e70d94ce33a59e98529cc4324af/soccer-teammates-men.json")
    .await(createVis);


