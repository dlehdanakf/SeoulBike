import "@babel/polyfill";
import $ from "jquery";
import { taffy } from "taffydb";
import { buildBikeDatabase, fetchAllBikeStatus } from "./components/bike";
import { sendMessageToChild as sendMessage } from "./components/message";

let DATABASE_LOADED = false;
let EVENT_QUEUE = [];

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

		DATABASE_LOADED = true;
		EVENT_QUEUE.forEach(e => {
			const { name, options } = e;
			if(name === `requestStationStatus`) {
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
			}
		});
	});

	window.addEventListener(`message`, function(e) {
		const { data } = e;
		const { name, options } = data;
		if(DATABASE_LOADED === false) {
			EVENT_QUEUE.push({ name, options });
			return;
		} else {
			if(name === `requestStationStatus`) {
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
			}
		}
	});
});