import { sendMessageToParent as sendMessage } from "./components/message";

const FAVORITE_LIST = [
	{
		parkingBikeTotCnt: `4`,
		stationId: `ST-3506`,
		stationName: `3506. 영동대교 북단`,
		rackTotCnt: `10`
	},
	{
		parkingBikeTotCnt: `12`,
		stationId: `ST-540`,
		stationName: `540. 군자역 7번출구 베스트샵 앞`,
		rackTotCnt: `10`
	}
];
const AROUND_LIST = [
	{
		parkingBikeTotCnt: `1`,
		stationId: `ST-592`,
		stationName: `592. 건국대학교 학생회관`,
		rackTotCnt: `10`
	},
	{
		parkingBikeTotCnt: `6`,
		stationId: `ST-591`,
		stationName: `591. 건국대학교 (행정관)`,
		rackTotCnt: `10`
	},
	{
		parkingBikeTotCnt: `14`,
		stationId: `ST-590`,
		stationName: `590. 건국대학교 (입학정보관)`
	}
];

const EVENT_LISTENER = {
	renderStationList: function(options, { allEl }) {
		const { stationList } = options;

		renderStationList(allEl, stationList);
	},
	renderSearchResult: function(options, { contentEl, searchEl }) {
		const { stationList, keyword } = options;
		if(keyword) {
			contentEl.dataset.keyword = keyword;
		}

		searchEl.innerHTML = ``;
		renderStationList(searchEl, stationList);
	}
};
const FIRE_EVENT = {
	requestStationList: function() {
		sendMessage({
			name: `requestStationList`,
			options: {  }
		});
	},
	requestSearchStation: function(keyword) {
		sendMessage({
			name: `requestSearchStation`,
			options: { keyword }
		});
	}
};

function _getMarkerLabelString(e) {
	const nameArr = e.split(` `);
	nameArr.splice(0, 1);

	return nameArr.join(` `);
}
function renderStationItem(station) {
	const { stationName, parkingBikeTotCnt, stationId } = station;
	const itemEl = document.createElement(`li`);
	itemEl.innerHTML =
		`<div class="station-content">
			<p>${stationId}</p>
			<h3>${_getMarkerLabelString(stationName)}</h3>
		</div>
		<div class="station-count" data-count="${parkingBikeTotCnt}">
			<p>대여가능</p>
			<p><span>${parkingBikeTotCnt}</span>대</p>
		</div>`
	;

	return itemEl;
}
function renderStationList(parentEl, stationList) {
	const fragmentEl = document.createDocumentFragment();
	stationList.forEach(station => {
		const stationEl = renderStationItem(station);
		stationEl.addEventListener(`click`, function() {
			sendMessage({
				name: `openStationModal`,
				options: { station }
			});
		});

		fragmentEl.appendChild(stationEl);
	});

	parentEl.appendChild(fragmentEl);
}

document.addEventListener(`DOMContentLoaded`, function() {
	const contentEl = document.querySelector(`#main-list`);
	const favoriteEl = contentEl.querySelector(`#favorite-list`);
	const aroundEl = contentEl.querySelector(`#around-list`);
	const allEl = contentEl.querySelector(`#all-list`);
	const searchEl = contentEl.querySelector(`#search-list`);

	let timeout = null;
	const searchInput = contentEl.querySelector(`#search-station`);
	searchInput.addEventListener(`input`, function(e) {
		const { value } = e.target;
		if(`${value}`.length < 1) {
			delete contentEl.dataset.keyword;
			return;
		}

		timeout = setTimeout(() => {
			if(timeout !== null)
				clearTimeout(timeout);

			FIRE_EVENT.requestSearchStation(this.value);
		}, 200);
	});

	renderStationList(favoriteEl, FAVORITE_LIST);
	renderStationList(aroundEl, AROUND_LIST);

	window.addEventListener(`message`, function(e) {
		const { data } = e;
		const { name, options } = data;

		if(
			EVENT_LISTENER.hasOwnProperty(name) &&
			typeof EVENT_LISTENER[name] === `function`
		) {
			EVENT_LISTENER[name](options, { favoriteEl, aroundEl, allEl, searchEl, contentEl });
		}
	});

	FIRE_EVENT.requestStationList();
});