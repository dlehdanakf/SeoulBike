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

	return { map, markerLayer };
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
		strokeColor: `#FFF`,
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