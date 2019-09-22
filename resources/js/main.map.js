function initTmap(){
	var map = new Tmap.Map({
		div:'map-container',
		width : "934px",
		height : "452px",
	});
	map.setCenter(new Tmap.LonLat("126.986072", "37.570028").transform("EPSG:4326", "EPSG:3857"), 15);
}
function constructMapInstance() {
	const contentEl = document.querySelector(`#main-content`);
	const { offsetWidth, offsetHeight } = contentEl;
	const map = new Tmap.Map({
		div: `map-container`,
		width: `${offsetWidth}px`,
		height: `${offsetHeight}px`
	});

	map.setCenter(new Tmap.LonLat("127.07621710650977", "37.54204488630741").transform("EPSG:4326", "EPSG:3857"), 16);
	return map;
}

document.addEventListener(`DOMContentLoaded`, function() {
	const map = constructMapInstance();

	window.tmap = map;
})