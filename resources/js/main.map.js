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
	const { map, markerLayer, vectorLayer } = constructMapInstance(contentEl, `map-container`);

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