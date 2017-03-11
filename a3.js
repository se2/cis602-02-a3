var countPlayers = function(array, key) {
    var count = {};
    array.map(function(d) {
    	if (count[d[key]] == undefined) {
    		count[d[key]] = 1;
    	} else {
    		count[d[key]] += 1;
    	}
    });
	return count;
}

var drawMap = function(mapData, data, key, htmlID) {

	var width = 1000,
	    height = 500

	/* draw svg and g elements */
	var svg = d3.select(htmlID)
			    .append("svg")
			    .attr("width", width)
			    .attr("height", height);

	var color = d3.scaleSequential(d3.interpolateReds);

	/* map projection */
	var projection = d3.geoRobinson()
					.scale(160);

	var path = d3.geoPath()
	    		.projection(projection);

	var mapCount = countPlayers(data, key);

	/* append to svg */
	svg.append("g")
	    .selectAll("path")
	    .data(mapData.features)
	    .enter().append("path")
	    .attr("fill", function(d) {
	        return (mapCount[d.properties.name] == undefined) ? "#fff" : color(mapCount[d.properties.name] / 8); })
	    .attr("d", path)
	    .attr("stroke", "#000")
		.attr("stroke-width", 0.5)
	    .attr("class", function(d) { return d.id })
}

function createVis(errors, mapData, womensData, mensData, teammateData) {

    if (errors) throw errors;

    drawMap(mapData, womensData, "Country", "#map-women");
    drawMap(mapData, mensData, "Nationality", "#map-men");
}

d3.queue().defer(d3.json, "https://cdn.rawgit.com/johan/world.geo.json/master/countries.geo.json")
    .defer(d3.json, "https://cdn.rawgit.com/dakoop/e4fa063e3f3415f3d3c79456bc4b6dc5/raw/a9e01691802c8e70d94ce33a59e98529cc4324af/fifa-17-women.json")
    .defer(d3.json, "https://cdn.rawgit.com/dakoop/e4fa063e3f3415f3d3c79456bc4b6dc5/raw/a9e01691802c8e70d94ce33a59e98529cc4324af/guardian-16-men.json")
    .defer(d3.json, "https://cdn.rawgit.com/dakoop/e4fa063e3f3415f3d3c79456bc4b6dc5/raw/a9e01691802c8e70d94ce33a59e98529cc4324af/soccer-teammates-men.json")
    .await(createVis);

