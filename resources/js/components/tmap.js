/* global Tmap */
import { taffy } from "taffydb";

const CENTER = new Tmap.LonLat(`127.07621710650977`, `37.54204488630741`);
const CACHE = taffy();

function _getMarkerColor(count) {
	let color = `success`;
	if(count == 0) {
		color = `critical`;
	} else if(count <= 3) {
		color = `yellow`;
	}

	return color;
}
function _getMarkerLabelString(e) {
	const nameArr = e.split(` `);
	nameArr.splice(0, 1);

	return nameArr.join(` `);
}
function _getMarkerLabelSource(name, count, map) {
	const color = _getMarkerColor(count);
	const cnt = count == 0 ? `없음` : count;

	if(parseInt(map.getZoom(), 10) >= 16) {
		const label = _getMarkerLabelString(name);
		return `https://img.shields.io/badge/${label}-${cnt}-${color}`;
	}

	return `https://img.shields.io/badge/${cnt}-${color}`;
}
function _renderMarkerImage(name, count, map) {
	return new Promise(resolve => {
		const imgSrc = _getMarkerLabelSource(name, count, map);
		const query = CACHE({src: imgSrc});
		if(query.count() > 0) {
			const { width, height, src } = query.first();
			resolve({ width, height, src });
		} else {
			const img = new Image;
			img.onload = function() {
				const { width, height } = img;
				const obj = { width, height, src: imgSrc };

				CACHE.insert(obj);
				resolve(obj);
			};
			img.src = imgSrc;
		}
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
export function renderMarker({ stationLatitude, stationLongitude, stationName, parkingBikeTotCnt }, map) {
	return new Promise(resolve => {
		_renderMarkerImage(stationName, parkingBikeTotCnt, map).then(e => {
			const { width, height, src } = e;

			const coordinate = new Tmap.LonLat(stationLongitude, stationLatitude).transform("EPSG:4326", "EPSG:3857");
			const markerSize = new Tmap.Size(width, height);
			const markerOffset = new Tmap.Pixel(-(markerSize.w / 2), -(markerSize.h / 2));
			const marker = new Tmap.Marker(coordinate, new Tmap.Icon(`${src}`, markerSize,  markerOffset));

			resolve(marker);
		});
	});
}