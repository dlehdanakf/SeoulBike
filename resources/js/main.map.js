import { sendMessageToParent as sendMessage, sendMessageToParent } from "./components/message";

const SIZE = new Tmap.Size(38, 38);
const OFFSET = new Tmap.Pixel(-(SIZE.w / 2), -(SIZE.h));
const CENTER = new Tmap.LonLat(`127.07621710650977`, `37.54204488630741`);

const EVENT_LISTENER = {
	markerList: [],
	_removeAllMarkers: function(markerLayer) {
		while(this.markerList.length > 0) {
			markerLayer.removeMarker(this.markerList.pop());
		}
	},

	renderStationStatus: function(options, { map, markerLayer }) {
		const { stationList } = options;

		this._removeAllMarkers(markerLayer);

		stationList.forEach(e => {
			const { stationLatitude, stationLongitude } = e;
			const lonlat = new Tmap.LonLat(stationLongitude, stationLatitude).transform("EPSG:4326", "EPSG:3857");
			const marker = new Tmap.Marker(lonlat, new Tmap.Icon('http://tmapapis.sktelecom.com/upload/tmap/marker/pin_b_m_a.png', SIZE,  OFFSET));

			markerLayer.addMarker(marker);
			this.markerList.push(marker);
		});
	}
};
const FIRE_EVENT = {
	requestStationStatus: function(map) {
		const extent = map.getExtent().transform("EPSG:3857", "EPSG:4326");
		const { top, bottom, left, right } = extent;

		sendMessage({
			name: `requestStationStatus`,
			options: { top, bottom, left, right }
		});
	}
};

function constructMapInstance() {
	const contentEl = document.querySelector(`#main-content`);
	const { offsetWidth, offsetHeight } = contentEl;
	const map = new Tmap.Map({
		div: `map-container`,
		width: `${offsetWidth}px`,
		height: `${offsetHeight}px`
	});

	const markerLayer = new Tmap.Layer.Markers();//마커 레이어 생성
	map.addLayer(markerLayer);//map에 마커 레이어 추가
	
	map.setCenter(CENTER.transform("EPSG:4326", "EPSG:3857"), 16);
	return { map, markerLayer };
}

document.addEventListener(`DOMContentLoaded`, function() {
	const { map, markerLayer } = constructMapInstance();

	FIRE_EVENT.requestStationStatus(map);
	map.events.register('moveend', map, () => {
		FIRE_EVENT.requestStationStatus(map);
	});

	window.addEventListener(`message`, function(e) {
		const { data } = e;
		const { name, options } = data;
	
		if(
			EVENT_LISTENER.hasOwnProperty(name) &&
			typeof EVENT_LISTENER[name] === `function`
		) {
			EVENT_LISTENER[name](options, { map, markerLayer });
		}
	});
});