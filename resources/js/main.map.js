import { sendMessageToParent as sendMessage } from "./components/message";
import { constructMapInstance, renderMarker, renderCluster, renderClusterCircle } from "./components/tmap.js";

const EVENT_LISTENER = {
	markerList: [],
	vectorList: [],
	_removeAllMarkers: function(markerLayer, vectorLayer) {
		while(this.markerList.length > 0) {
			markerLayer.removeMarker(this.markerList.pop());
		}

		vectorLayer.removeFeatures(this.vectorList);
		this.vectorList = [];
	},

	renderStationStatus: function(options, { map, markerLayer, vectorLayer }) {
		const { stationList } = options;
		this._removeAllMarkers(markerLayer, vectorLayer);

		stationList.forEach(e => {
			renderMarker(e, map).then(marker => {
				markerLayer.addMarker(marker);
				this.markerList.push(marker);
			});
			
			const lonlat = new Tmap.LonLat(127.07876520506841, 37.54133141833535).transform("EPSG:4326", "EPSG:3857");//좌표 설정
			const size = new Tmap.Size(30, 30);//아이콘 크기 설정
			const offset = new Tmap.Pixel(-(size.w / 2), -(size.h));//아이콘 중심점 설정
			const icon = new Tmap.Icon('https://png2.cleanpng.com/sh/8fdb812201f51391394019e16e4d4379/L0KzQYm3U8IxN6l3iZH0aYP2gLBuTfdxe15zeehyZ3H3ebF1TgN6e6VqheU2Y3BwgMb7hgIucZR0huU2c3PkfLLpjPUufpZoReRuZD3wccG0jP9kaZ1uktN9aXBxPbrqjB4uPZJnSNQ9ZnKzSbO9gcQvQGc7T6QEOUe0RYO4VcMxOWE8SKUEOD7zfri=/kisspng-gps-navigation-systems-computer-icons-scalable-vec-red-map-localization-icon-5ab0b4fb09b6a4.8667299715215301070398.png',size, offset);//마커 아이콘 설정
			const tmarker = new Tmap.Marker(lonlat, icon);//마커 생성
			markerLayer.addMarker(tmarker);//레이어에 마커 추가
			this.markerList.push(tmarker);
		});
	},
	renderStationCluster: function(options, { map, markerLayer, vectorLayer }) {
		const { clusterList } = options;
		this._removeAllMarkers(markerLayer, vectorLayer);
		
		clusterList.forEach(e => {
			renderCluster(e, map).then(marker => {
				markerLayer.addMarker(marker);
				this.markerList.push(marker);

				const circle = renderClusterCircle(e, map);
				this.vectorList.push(circle);
				vectorLayer.addFeatures([circle]); 
			});
		})
	}
};
const FIRE_EVENT = {
	requestStationStatus: function(map) {
		const extent = map.getExtent().transform("EPSG:3857", "EPSG:4326");
		const { top, bottom, left, right } = extent;
		const zoom = map.getZoom();

		sendMessage({
			name: `requestStationStatus`,
			options: { top, bottom, left, right, zoom }
		});
	}
};


document.addEventListener(`DOMContentLoaded`, function() {
	const contentEl = document.querySelector(`#main-content`);
	const { map, markerLayer, vectorLayer, tData } = constructMapInstance(contentEl, `map-container`);

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
			EVENT_LISTENER[name](options, { map, markerLayer, vectorLayer });
		}
	});
});