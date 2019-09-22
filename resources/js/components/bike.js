import $ from 'jquery';
import { taffy } from "taffydb";

const SEOUL_KEY = `56726d5744646c65343972427a4951`;
const TMAP_KEY = ``;

function fetchBikeStatus(start = 1, end = 1000) {
	return new Promise(resolve => {
		$.ajax({
			url: `http://openapi.seoul.go.kr:8088/${SEOUL_KEY}/json/bikeList/${start}/${end}/`,
			type: `GET`,
			cache: false,
			dataType: `json`,
			success: function(data) {
				const { rentBikeStatus } = data;
				const { row, RESULT } = rentBikeStatus;
				if(RESULT.CODE === `INFO-000`) {
					resolve(row);
				} else {
					resolve([]);
				}
			},
			error: function (request) {
				const { status, responseText } = request;
				console.error(`ajax Error!`, status, responseText);
			}
		});
	});
}
export async function fetchAllBikeStatus() {
	const bikePageOne = await fetchBikeStatus(1, 1000);
	const bikePageTwo = await fetchBikeStatus(1001, 2000);

	return [
		...bikePageOne,
		...bikePageTwo
	];
}
export async function buildBikeDatabase() {
	const bikeList = await fetchAllBikeStatus();
	return taffy(bikeList);
}