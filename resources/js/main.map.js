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

const FIND_ROUTE = {
	markerList: [],
	routeLayer: null,
	removeRoute: function(map, markerLayer) {
		while(this.markerList.length > 0) {
			markerLayer.removeMarker(this.markerList.pop());
		}
		if(this.routeLayer !== null) {
			map.removeLayer(this.routeLayer);
		}
	},
	requestFindRoute: function(map, markerLayer, start, end, startStation, endStation) {
		var routeLayer = new Tmap.Layer.Vector("route");// 백터 레이어 생성
		this.routeLayer = routeLayer;
		
		var size = new Tmap.Size(24, 38);
		var offset = new Tmap.Pixel(-(size.w / 2), -size.h);
		var marker, icon;

		// 시작
		icon = new Tmap.IconHtml("<img src='http://tmapapis.sktelecom.com/upload/tmap/marker/pin_r_m_s.png' />", size, offset);
		marker = new Tmap.Marker(new Tmap.LonLat(start.lon, start.lat).transform("EPSG:4326", "EPSG:3857"), icon);
		this.markerList.push(marker);
		markerLayer.addMarker(marker);

		// 도착
		icon = new Tmap.IconHtml("<img src='http://tmapapis.sktelecom.com/upload/tmap/marker/pin_r_m_e.png' />", size, offset);
		marker = new Tmap.Marker(new Tmap.LonLat(end.lon, end.lat).transform("EPSG:4326", "EPSG:3857"), icon);
		this.markerList.push(marker);
		markerLayer.addMarker(marker);


		// 3. 경유지 심볼 찍기
		icon = new Tmap.IconHtml("<img src='http://tmapapis.sktelecom.com/upload/tmap/marker/pin_b_m_1.png' />", size, offset);
		marker = new Tmap.Marker(new Tmap.LonLat(startStation.lon, startStation.lat).transform("EPSG:4326", "EPSG:3857"), icon);
		this.markerList.push(marker);
		markerLayer.addMarker(marker);

		icon = new Tmap.IconHtml("<img src='http://tmapapis.sktelecom.com/upload/tmap/marker/pin_b_m_2.png' />", size, offset);
		marker = new Tmap.Marker(new Tmap.LonLat(endStation.lon, endStation.lat).transform("EPSG:4326", "EPSG:3857"), icon);
		this.markerList.push(marker);
		markerLayer.addMarker(marker);

		// 4. 경유지 최적화 API 사용요청
		var prtcl;
		var headers = {}; 
		headers["appKey"]="3b93e7ea-9bb4-4402-afdb-a96aaab9fa23";
		$.ajax({
			method:"POST",
			headers : headers,
			url:"https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=xml",//보행자 경로안내 api 요청 url입니다.
			async:false,
			data:{
				//출발지 위경도 좌표입니다.
				startX: start.lon,
				startY: start.lat,
				//목적지 위경도 좌표입니다.
				endX: end.lon,
				endY: end.lat,
				//경유지의 좌표입니다.
				passList : `${startStation.lon},${startStation.lat}_${endStation.lon},${endStation.lat}`,
				//출발지, 경유지, 목적지 좌표계 유형을 지정합니다.
				reqCoordType : "WGS84GEO",
				resCoordType : "EPSG3857",
				//각도입니다.
				//출발지 명칭입니다.
				startName : "출발지",
				//목적지 명칭입니다.
				endName : "도착지"
			},
			//데이터 로드가 성공적으로 완료되었을 때 발생하는 함수입니다.
			success:function(response){
				prtcl = response;
				
				// 결과 출력
				var prtclString = new XMLSerializer().serializeToString(prtcl);//xml to String	
				var xmlDoc = $.parseXML( prtclString ),
				$xml = $( xmlDoc ),
				$intRate = $xml.find("Document");
				
				var tDistance = "총 거리 : "+($intRate[0].getElementsByTagName("tmap:totalDistance")[0].childNodes[0].nodeValue/1000).toFixed(1)+"km,";
				var tTime = " 총 시간 : "+($intRate[0].getElementsByTagName("tmap:totalTime")[0].childNodes[0].nodeValue/60).toFixed(0)+"분";	
				
				prtcl=new Tmap.Format.KML({extractStyles:true, extractAttributes:true}).read(prtcl);//데이터(prtcl)를 읽고, 벡터 도형(feature) 목록을 리턴합니다.
				//표준 데이터 포맷인 KML을 Read/Write 하는 클래스 입니다.
				//벡터 도형(Feature)이 추가되기 직전에 이벤트가 발생합니다.
				routeLayer.events.register("beforefeatureadded", routeLayer, onBeforeFeatureAdded);
						function onBeforeFeatureAdded(e) {
								var style = {};
								switch (e.feature.attributes.styleUrl) {
								default:
									style.strokeColor = "#ff0000";//stroke에 적용될 16진수 color
									style.strokeOpacity = "1";//stroke의 투명도(0~1)
									style.strokeWidth = "5";//stroke의 넓이(pixel 단위)
								};
							e.feature.style = style;
						}
				
				routeLayer.addFeatures(prtcl);//레이어에 도형을 등록합니다.
				map.addLayer(routeLayer);//맵에 레이어 추가
				map.setLayerIndex(markerLayer, 1);
				map.setLayerIndex(routeLayer, 0);
				map.zoomToExtent(routeLayer.getDataExtent());//map의 zoom을 routeLayer의 영역에 맞게 변경합니다.
			},
			//요청 실패시 콘솔창에서 에러 내용을 확인할 수 있습니다.
			error:function(request,status,error){
				console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error);
			}
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