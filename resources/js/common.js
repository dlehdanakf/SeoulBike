import "@babel/polyfill";

import { taffy } from "taffydb";
import { orderByDistance, findNearest } from 'geolib';

import StationModal from "./components/station.modal";
import geoCluster from "./components/geocluster";
import { fetchAllBikeStatus } from "./components/bike";
import { sendMessageToChild as sendMessage } from "./components/message";

const LANG = {
    ko: {
        0: `알림`,
        1: `한국어`,
        2: `회원`,
        3: `실시간`,
        4: `경로탐색`,
        5: `대여하기`,
        6: `이용권`,
        7: `이용안내`
    },
    en: {
        0: `Noti`,
        1: `English`,
        2: `Profile`,
        3: `Status`,
        4: `Route`,
        5: `Rent`,
        6: `Ticket`,
        7: `Info`
    }
};
let currentLang = "ko";

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
	openStationModal: function(options, { stationEl }) {
		const { station } = options;
		stationEl.setState(station);
	},

	_findNeareast: (position, stationList) => {
		const { lon, lat } = position;
		const { longitude, latitude } = findNearest({ longitude: lon, latitude: lat }, stationList);

		return {
			lon: longitude,
			lat: latitude
		};
	},
	_searchNearStations: function(positions, bikeDB) {
		const rawList = bikeDB().get();
		const stationList = [];
		rawList.forEach(function(station) {
			const { stationLatitude, stationLongitude } = station;
			stationList.push({
				longitude: stationLongitude,
				latitude: stationLatitude
			});
		});

		const { start, end } = positions;
		const startStation = this._findNeareast(start, stationList);
		const endStation = this._findNeareast(end, stationList);

		return {
			startStation,
			endStation
		};
	},
	requestRoutePositions: function(options, { iframeEl, bikeDB }) {
		const { start, end } = options;
		const { startStation, endStation } = this._searchNearStations({ start, end }, bikeDB);

		sendMessage(iframeEl, {
			name: `renderRoutes`,
			options: { start, end, startStation, endStation }
		});
	},

	requestStationList: function(options, { iframeEl, bikeDB }) {
		const stationList = bikeDB().get();
		sendMessage(iframeEl, {
			name: `renderStationList`,
			options: { stationList }
		});
	},

	_searchKeyword: (bikeDB, keyword) => {
		const query = bikeDB({
			stationName: {
				likenocase: `${keyword}`
			}
		});

		return query.get();
	},
	requestSearchStation: function(options, { iframeEl, bikeDB }) {
		const { keyword } = options;
		const stationList = this._searchKeyword(bikeDB, keyword);

		sendMessage(iframeEl, {
			name: `renderSearchResult`,
			options: { stationList, keyword }
		});
	},

	requestLanguageStatus: function(options, { iframeEl }) {
		sendMessage(iframeEl, {
			name: `changeLanguage`,
			options: { language : currentLang }
		});
	}
};
function bindNavClickEvent(iframeEl) {
	const footerEl = document.querySelector(`#application-footer`);
	const buttonEls = footerEl.querySelectorAll(`a.nav-button`);
	buttonEls.forEach(buttonEl => {
		buttonEl.addEventListener(`click`, function(e) {
			e.preventDefault();

			const { href } = this;
			if(!href || href === `#`) {
				return;
			}

			if(iframeEl.src === href) {
				return;
			}

			iframeEl.src = href;
			buttonEls.forEach(nodeEl => {
				delete nodeEl.dataset.active;
			});

			buttonEl.dataset.active = `${true}`;
		});
	});
}
function createStationModal() {
	const stationEl = document.createElement(`station-modal`);
	document.body.appendChild(stationEl);

	return stationEl;
}

document.addEventListener(`DOMContentLoaded`, function() {
	const contentEl = document.querySelector(`#application-content`)
	const iframeEl = document.querySelector(`#application-frame`);
	iframeEl.style.width = `${contentEl.offsetWidth}px`;
	iframeEl.style.height = `${contentEl.offsetHeight}px`;

	bindNavClickEvent(iframeEl);
	window.customElements.define(`station-modal`, StationModal);
	const stationEl = createStationModal();

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
				EVENT_LISTENER[name](options, { iframeEl, stationEl, bikeDB });
			}
		});

		while(EVENT_LISTENER.EVENT_QUEUE.length > 0) {
			const { name, options } = EVENT_LISTENER.EVENT_QUEUE.pop();
			if(
				EVENT_LISTENER.hasOwnProperty(name) &&
				typeof EVENT_LISTENER[name] === `function`
			) {
				EVENT_LISTENER[name](options, { iframeEl, stationEl, bikeDB });
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
				EVENT_LISTENER[name](options, { iframeEl, stationEl, bikeDB });
			}
		}
	});

	document.getElementById('translate').addEventListener('click', function(e) {
		e.preventDefault();
		switch(currentLang) {
			case "ko":
				changeLanguage("en");
				currentLang = "en";
			break;
			case "en":
				changeLanguage("ko");
				currentLang = "ko";
			break;
		}
	});

	function changeLanguage(option) {
		const langEl = document.querySelectorAll(`[data-lang-num]`);
		langEl.forEach(nodeEl => {
			const { langNum } = nodeEl.dataset;
			nodeEl.innerHTML = `${LANG[option][langNum]}`;
		});

		sendMessage(iframeEl, {
			name: `changeLanguage`,
			options: { language: option }
		});
	}
});