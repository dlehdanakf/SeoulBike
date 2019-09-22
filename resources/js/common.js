import "@babel/polyfill";
import $ from "jquery";
import { buildBikeDatabase } from "./components/bike";
import { sendMessageToChild as sendMessage } from "./components/message";

document.addEventListener(`DOMContentLoaded`, function() {
	const contentEl = document.querySelector(`#application-content`)
	const iframeEl = document.querySelector(`#application-frame`);
	iframeEl.style.width = `${contentEl.offsetWidth}px`;
	iframeEl.style.height = `${contentEl.offsetHeight}px`;

	buildBikeDatabase().then(e => {
		console.log(e({stationId: "ST-1132"}).first());
	});
});