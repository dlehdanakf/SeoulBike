/* global Tmap */

import "text-image";
import { taffy } from "taffydb";
import { sendMessageToParent } from "./message";

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

	const vectorLayer = new Tmap.Layer.Vector('Tmap Vector Layer');
	map.addLayers([vectorLayer]);
	map.setLayerIndex(vectorLayer, 0);

	return { map, markerLayer, vectorLayer };
}

export function renderMarker(station, map) {
	const {
		stationLatitude, stationLongitude,
		stationName, parkingBikeTotCnt
	} = station;

	return new Promise(resolve => {
		_renderMarkerImage(stationName, parkingBikeTotCnt, map).then(e => {
			const { width, height, src } = e;

			const coordinate = new Tmap.LonLat(stationLongitude, stationLatitude).transform("EPSG:4326", "EPSG:3857");
			const markerSize = new Tmap.Size(width, height);
			const markerOffset = new Tmap.Pixel(-(markerSize.w / 2), -(markerSize.h / 2));

			const marker = new Tmap.Marker(coordinate, new Tmap.Icon(`${src}`, markerSize,  markerOffset));
			marker.events.register(`click`, marker, function() {
				sendMessageToParent({
					name: `openStationModal`,
					options: { station }
				});
			});
			marker.events.register(`touchend`, marker, function() {
				sendMessageToParent({
					name: `openStationModal`,
					options: { station }
				});
			});

			resolve(marker);
		});
	});
}

function _renderText(message) {
	const textImg = new TextImage({
		font: `sans-serif`,
		align: `center`,
		color: `#212121`,
		size: 18,
		background: `transparent`,
		stroke: 2,
		strokeColor: `rgba(255, 255, 255, 0.8)`,
		lineHeight: `1`,
	});

	return new Promise(resolve => {
		const base64 = textImg.toDataURL(`${message}`);
		const img = new Image;
		img.onload = function() {
			const { width, height } = this;
			resolve({ base64, width, height });
		};

		img.src = base64;
	});
}
export function renderCluster(cluster, map) {
	const { latitude, longitude, count } = cluster;
	return new Promise(resolve => {
		_renderText(count).then(e => {
			const { base64, width, height } = e;

			const coordinate = new Tmap.LonLat(longitude, latitude).transform("EPSG:4326", "EPSG:3857");
			const markerSize = new Tmap.Size(width, height);
			const markerOffset = new Tmap.Pixel(-(markerSize.w / 2), -(markerSize.h / 2));

			const marker = new Tmap.Marker(coordinate, new Tmap.Icon(`${base64}`, markerSize,  markerOffset));

			marker.events.register(`click`, marker, function() {
				const centerLonLat = new Tmap.LonLat(longitude, latitude);
				map.setCenter(centerLonLat.transform(`EPSG:4326`, `EPSG:3857`), map.getZoom() + 1);
			});
			marker.events.register(`touchend`, marker, function() {
				const centerLonLat = new Tmap.LonLat(longitude, latitude);
				map.setCenter(centerLonLat.transform(`EPSG:4326`, `EPSG:3857`), map.getZoom() + 1);
			});

			resolve(marker);
		});
	});
}
export function renderClusterCircle(cluster, map) {
	const { latitude, longitude, farcoordinate } = cluster;
	
	var style_red = {
		fillColor:"#FF0000",
		fillOpacity:0.2,
		strokeColor: "#FF0000",
		strokeWidth: 3,
		strokeDashstyle: "solid",
		pointRadius: 60
	};

	/*var centerlonlat = map.getPixelFromLonLat(new Tmap.LonLat(longitude, latitude).transform("EPSG:4326", "EPSG:3857"));
	var farlonlat = map.getPixelFromLonLat(new Tmap.LonLat(farcoordinate.longitude, farcoordinate. latitude).transform("EPSG:4326", "EPSG:3857"));
	
	var centerpx = new Tmap.Pixel(centerlonlat["x"], centerlonlat["y"]);
	var farpx = new Tmap.Pixel(farlonlat["x"], farlonlat["y"]);
	
	var dist = centerpx.distanceTo(farpx);
	console.log('dist : ' + dist);

	var coord = new Tmap.LonLat(longitude, latitude).transform("EPSG:4326", "EPSG:3857");
	var circlesize = parseInt(dist*5);*/ 

	var coord = new Tmap.LonLat(longitude, latitude).transform("EPSG:4326", "EPSG:3857");
	var circlesize;

	switch(map.getZoom()) {
		case 13: circlesize = 1300; break;
		case 12: circlesize = 2000; break;
		case 11: circlesize = 3000; break;
		case 10: circlesize = 5000; break;
		case 9: case 8: case 7: case 6: case 5: case 4: case 3: case 2: case 1: circlesize = 6000; break;
	}

	var circle = new Tmap.Geometry.Circle(coord.lon, coord.lat, circlesize);
	var circleFeature = new Tmap.Feature.Vector(circle, null, style_red);

	return circleFeature;
}