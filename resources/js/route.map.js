import { constructMapInstance, renderCluster, renderClusterCircle, renderMarker } from "./components/tmap";
import { renderRoute, removeRoute } from "./components/route";
import { sendMessageToParent as sendMessage } from "./components/message";

const START_POSITION = {
	lon: `127.078811`,
	lat: `37.541579`
};
const END_POSITION = {
	lon: `127.068070`,
	lat: `37.529859`
}

const EVENT_LISTENER = {
	renderRoutes: function(options, { map, markerLayer, vectorLayer }) {
		const { start, end, startStation, endStation } = options;

		removeRoute(map, markerLayer);
		renderRoute(map, markerLayer, { start, end, startStation, endStation });
	}
};
const FIRE_EVENT = {
	requestRoutePositions: function(start, end) {
		/**
		 *	########### Placeholder ###########
		 */
		sendMessage({
			name: `requestRoutePositions`,
			options: { start: START_POSITION, end: END_POSITION }
		});
	}
};

document.addEventListener(`DOMContentLoaded`, function() {
	const contentEl = document.querySelector(`#route-content`);
	const { map, markerLayer, vectorLayer, tData } = constructMapInstance(contentEl, `map-container`);

	const formEl = document.querySelector(`#route-form`);
	formEl.addEventListener(`submit`, function(e) {
		e.preventDefault();
		FIRE_EVENT.requestRoutePositions();
		return false;
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