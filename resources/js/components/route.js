const MARKER_LIST = [];
const MARKER_ICON = {
	start: `pin_r_m_s.png`,
	end: `pin_r_m_e.png`,
	startStation: `pin_b_m_1.png`,
	endStation: `pin_b_m_2.png`
};
let ROUTE_LAYER = null;

export function removeRoute(map, markerLayer) {
	while(MARKER_LIST.length > 0) {
		markerLayer.removeMarker(MARKER_LIST.pop());
	}

	if(ROUTE_LAYER !== null) {
		map.removeLayer(ROUTE_LAYER);
		ROUTE_LAYER = null;
	}
}

function generateMarker(label, position) {
	const size = new Tmap.Size(24, 38);
	const offset = new Tmap.Pixel(-(size.w / 2), -size.h);
	const html = `<img src="http://tmapapis.sktelecom.com/upload/tmap/marker/${MARKER_ICON[label]}" />`;

	const { lon, lat } = position;
	const icon = new Tmap.IconHtml(html, size, offset);
	const marker = new Tmap.Marker(new Tmap.LonLat(lon, lat).transform(`EPSG:4326`, `EPSG:3857`), icon);

	return marker;
}
function parseXML(prtcl) {
	const parser = new DOMParser();
	const xmlDocument = parser.parseFromString(prtcl, `text/xml`);

	const [ documentEl ] = xmlDocument.getElementsByTagName(`Document`);
	const [ distanceEl ] = documentEl.getElementsByTagName(`tmap:totalDistance`);
	const [ timeEl ] = documentEl.getElementsByTagName(`tmap:totalTime`);

	return {
		distance: distanceEl.innerHTML,
		time: timeEl.innerHTML
	};
}
function requestRoute({ start, end, startStation, endStation }) {
	const data = {
		startX: start.lon,
		startY: start.lat,

		endX: end.lon,
		endY: end.lat,

		passList : `${startStation.lon},${startStation.lat}_${endStation.lon},${endStation.lat}`,

		reqCoordType : `WGS84GEO`,
		resCoordType : `EPSG3857`,

		startName : `출발지`,
		endName : `도착지`
	};
	const formData = new window.FormData;
	Object.keys(data).forEach(key => {
		formData.append(key, data[key]);
	});

	return new Promise(resolve => {
		const xhr = new window.XMLHttpRequest();
		xhr.addEventListener(`load`, function() {
			const { responseText } = xhr;
			const { distance, time } = parseXML(responseText);

			resolve({
				distance, time, xml: responseText
			});
		});
		xhr.open(`POST`, `https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=xml`);
		xhr.setRequestHeader(`appKey`, `3b93e7ea-9bb4-4402-afdb-a96aaab9fa23`);

		xhr.send(JSON.stringify(data));
	});
}

export function renderRoute(map, markerLayer, positions) {
	ROUTE_LAYER = new Tmap.Layer.Vector(`route`);
	ROUTE_LAYER.events.register("beforefeatureadded", ROUTE_LAYER, onBeforeFeatureAdded);
	function onBeforeFeatureAdded(e) {
		let style = {};
		style.strokeColor = "#ff0000";
		style.strokeOpacity = "1";
		style.strokeWidth = "5";
		e.feature.style = style;
	}

	([`start`, `end`, `startStation`, `endStation`]).forEach(e => {
		const marker = generateMarker(e, positions[e]);
		MARKER_LIST.push(marker);
		markerLayer.addMarker(marker);
	});

	requestRoute(positions).then(({ distance, time, xml }) => {
		const prtcl = new Tmap.Format.KML({ extractStyles:true, extractAttributes:true }).read(xml);
		ROUTE_LAYER.addFeatures(prtcl);

		map.addLayer(ROUTE_LAYER);
		map.setLayerIndex(markerLayer, 1);
		map.setLayerIndex(ROUTE_LAYER, 0);
		map.zoomToExtent(ROUTE_LAYER.getDataExtent());
	});
}