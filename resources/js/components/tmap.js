/* global Tmap */
const CENTER = new Tmap.LonLat(`127.07621710650977`, `37.54204488630741`);

function _getMarkerLabelSource(name, count) {
	let color = `success`;
	if(count == 0) {
		color = `critical`;
	} else if(count < 3) {
		color = `yellow`;
	}

	const label = (function(e) {
		const nameArr = e.split(` `);
		nameArr.splice(0, 1);

		return nameArr.join(` `);
	})(name);

	return `https://img.shields.io/badge/${label}-${count == 0 ? `없음` : count}-${color}`;
}
function _renderMarkerImage(name, count) {
	return new Promise(resolve => {
		const imgSrc = _getMarkerLabelSource(name, count);
		const img = new Image;
		img.onload = function() {
			resolve({ width: this.width, height: this.height, src: imgSrc });
		};
		img.src = imgSrc;
	});
}

export function constructMapInstance(contentEl, nodeQuery) {
	if(contentEl === undefined) {
		return { };
	}

	const { offsetWidth, offsetHeight } = contentEl;
	const map = new Tmap.Map({
		div: `${nodeQuery}`,
		width: `${offsetWidth}px`,
		height: `${offsetHeight}px`
	});

	const markerLayer = new Tmap.Layer.Markers;
	map.addLayer(markerLayer);
	map.setCenter(CENTER.transform(`EPSG:4326`, `EPSG:3857`), 16);

	return { map, markerLayer };
}
export function renderMarker({ stationLatitude, stationLongitude, stationName, parkingBikeTotCnt }) {
	return new Promise(resolve => {
		_renderMarkerImage(stationName, parkingBikeTotCnt).then(e => {
			const { width, height, src } = e;

			const coordinate = new Tmap.LonLat(stationLongitude, stationLatitude).transform("EPSG:4326", "EPSG:3857");
			const markerSize = new Tmap.Size(width, height);
			const markerOffset = new Tmap.Pixel(-(markerSize.w / 2), -(markerSize.h / 2));
			const marker = new Tmap.Marker(coordinate, new Tmap.Icon(`${src}`, markerSize,  markerOffset));

			resolve(marker);
		});
	});
}