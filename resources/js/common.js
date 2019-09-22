import "@babel/polyfill";
import $ from "jquery";
import { taffy } from "taffydb";

import { fetchAllBikeStatus } from "./components/bike";
import { sendMessageToChild as sendMessage } from "./components/message";

const EVENT_LISTENER = {
	DATABASE_LOADED: false,
	EVENT_QUEUE: [],

	requestStationStatus: function(options, { iframeEl, bikeDB }) {
		const { top, bottom, left, right } = options;
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

		sendMessage(iframeEl, {
			name: `renderStationStatus`,
			options: {
				stationList: query.get()
			}
		});
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