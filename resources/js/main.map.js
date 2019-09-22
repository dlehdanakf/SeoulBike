import { sendMessageToParent as sendMessage, sendMessageToParent } from "./components/message";
/*function initTmap(){
	var map = new Tmap.Map({
		div:'map-container',
		width : "934px",
		height : "452px",
	});
	map.setCenter(new Tmap.LonLat("126.986072", "37.570028").transform("EPSG:4326", "EPSG:3857"), 15);
}*/

const SIZE = new Tmap.Size(38, 38);//아이콘 크기
const OFFSET = new Tmap.Pixel(-(SIZE.w / 2), -(SIZE.h));//아이콘 중심점
const MARKER = [];

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
	
	map.setCenter(new Tmap.LonLat("127.07621710650977", "37.54204488630741").transform("EPSG:4326", "EPSG:3857"), 16);
	return { map, markerLayer };
}

document.addEventListener(`DOMContentLoaded`, function() {
	const { map, markerLayer } = constructMapInstance();
	window.tmap = map;

	const { top, bottom, left, right } = map.getExtent().transform("EPSG:3857", "EPSG:4326")
	sendMessage({
		name: `requestStationStatus`,
		options: {
			top, bottom, left, right
		}
	});

	map.events.register("moveend", map, function() {
		const { top, bottom, left, right } = map.getExtent().transform("EPSG:3857", "EPSG:4326")
		sendMessage({
			name: `requestStationStatus`,
			options: {
				top, bottom, left, right
			}
		});
	});

	window.addEventListener(`message`, function(e) {
		const { data } = e;
		const { name, options } = data;
		if(name === `renderStationStatus`) {
			const { stationList } = options;
			
			while(MARKER.length > 0) {
				markerLayer.removeMarker(MARKER.pop());
			}
			stationList.forEach(e => {
				const { stationLatitude, stationLongitude } = e;
				const lonlat = new Tmap.LonLat(stationLongitude, stationLatitude).transform("EPSG:4326", "EPSG:3857");
				let marker = new Tmap.Marker(lonlat, new Tmap.Icon('http://tmapapis.sktelecom.com/upload/tmap/marker/pin_b_m_a.png', SIZE,  OFFSET));
				markerLayer.addMarker(marker);

				console.log(stationLatitude, stationLongitude);
				MARKER.push(marker);
			});
		}
	});



});