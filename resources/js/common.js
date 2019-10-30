import "@babel/polyfill";

import { taffy } from "taffydb";
import geoCluster from "./components/geocluster";
import { fetchAllBikeStatus } from "./components/bike";
import { sendMessageToChild as sendMessage } from "./components/message";
import { orderByDistance, convertSpeed, findNearest } from 'geolib';

const EVENT_LISTENER = {
	DATABASE_LOADED: false,
	EVENT_QUEUE: [],

	_selectStations: function(bikeDB, { top, bottom, left, right }) {
		const query = bikeDB({
			stationLatitude: {
				'>=': bottom,
				'<=': top
			},
			stationLongitude: {
				'>=': left,
				'<=': right
			}
		});

		return query.get();
	},
	_getBias: (zoom) => {
		if(zoom < 10) return zoom;
		return (20 - zoom) * 0.6;
	},
	_getFarCoordinate: function(cluster) {
		const { centroid, elements } = cluster;

		let lonlatList = [];
		elements.forEach(e => {
			const [ latitude, longitude ] = e;
			lonlatList.push({ latitude: parseFloat(latitude), longitude : parseFloat(longitude) });
		});

		var distList = orderByDistance({ latitude: parseFloat(centroid.latitude), longitude: parseFloat(centroid.longitude) }, lonlatList);		
		return distList[distList.length - 1];
	},
	_calculateClusters: function(stationList, zoom) {
		const coordinates = [];
		stationList.forEach(({ stationLongitude, stationLatitude, parkingBikeTotCnt }) => {
			const cnt = parseInt(parkingBikeTotCnt, 10);
			for(let i = 0; i < cnt; i++) {
				coordinates.push([
					parseFloat(stationLatitude),
					parseFloat(stationLongitude)
				]);
			}
		});

		const bias = this._getBias(zoom);
		const clusterList = geoCluster(coordinates, bias);
		console.log(`clusterSeed`, zoom, bias);
		const result = [];
		clusterList.forEach(cluster => {
			const { centroid, elements } = cluster;
			const [ latitude, longitude ] = centroid;

			const farcoordinate = this._getFarCoordinate(cluster);

			result.push({
				latitude, longitude, count: elements.length, farcoordinate
			});
		});

		return result;
	},

	requestStationStatus: function(options, { iframeEl, bikeDB }) {
		const { top, bottom, left, right, zoom } = options;
		const stationList = this._selectStations(bikeDB, { top, bottom, left, right });
		if(parseInt(zoom, 10) >= 14) {
			sendMessage(iframeEl, {
				name: `renderStationStatus`,
				options: { stationList }
			});
		} else {
			const clusterList = this._calculateClusters(stationList, parseInt(zoom, 10));
			sendMessage(iframeEl, {
				name: `renderStationCluster`,
				options: { clusterList }
			});
		}
	},
	openStationModal: function(options, { iframeEl, bikeDB }) {
		alert(options.station.stationId);
	}
};

document.addEventListener(`DOMContentLoaded`, function() {
	const contentEl = document.querySelector(`#application-content`)
	const iframeEl = document.querySelector(`#application-frame`);
	iframeEl.style.width = `${contentEl.offsetWidth}px`;
	iframeEl.style.height = `${contentEl.offsetHeight}px`;

	const bikeDB = taffy();
	fetchAllBikeStatus().then(data => {
		data.forEach(e => {
			bikeDB.insert(e);
		});

		EVENT_LISTENER.DATABASE_LOADED = true;
		EVENT_LISTENER.EVENT_QUEUE.forEach(e => {
			if(
				EVENT_LISTENER.hasOwnProperty(name) &&
				typeof EVENT_LISTENER[name] === `function`
			) {
				EVENT_LISTENER[name](options, { iframeEl, bikeDB });
			}
		});

		while(EVENT_LISTENER.EVENT_QUEUE.length > 0) {
			const { name, options } = EVENT_LISTENER.EVENT_QUEUE.pop();
			if(
				EVENT_LISTENER.hasOwnProperty(name) &&
				typeof EVENT_LISTENER[name] === `function`
			) {
				EVENT_LISTENER[name](options, { iframeEl, bikeDB });
			}
		}
	});

	window.addEventListener(`message`, function(e) {
		const { data } = e;
		const { name, options } = data;
		
		if(EVENT_LISTENER.DATABASE_LOADED === false) {
			EVENT_LISTENER.EVENT_QUEUE.push({ name, options });
		} else {
			if(
				EVENT_LISTENER.hasOwnProperty(name) &&
				typeof EVENT_LISTENER[name] === `function`
			) {
				EVENT_LISTENER[name](options, { iframeEl, bikeDB });
			}
		}
	});
});