function _getMarkerLabelString(e) {
	const nameArr = e.split(` `);
	nameArr.splice(0, 1);

	return nameArr.join(` `);
}

class StationModal extends HTMLElement {
	constructor() {
		super();

		this.setState = this.setState.bind(this);
		this.render = this.render.bind(this);
		this.close = this.close.bind(this);
		this.open = this.open.bind(this);

		this.state = {};
	}
	setState(newState) {
		const { stationName, parkingBikeTotCnt, rackTotCnt } = newState;
		this.state = {
			stationName,
			parkingBikeTotCnt,
			rackTotCnt
		};

		this.render();
		this.open();
	}
	render() {
		const { stationName, parkingBikeTotCnt, rackTotCnt } = this.state;
		this.innerHTML =
			`<div class="modal-content">
				<div class="modal-header">
					<p>따릉이 자전거 대여소</p>
					<h1>${_getMarkerLabelString(stationName)}</h1>
					<a href="#" role="close-modal"><i class="xi-close"></i></a>
				</div>
				<div class="modal-body" data-count="${parkingBikeTotCnt}">
					<p class="title">현재 총 <span class="count">${parkingBikeTotCnt}</span>대 대여가능</p>
					<p class="title-none">대여가능한 자전거 없음</p>
					<p class="description">주차가능한 거치대 수 : 총 ${rackTotCnt}개</p>
					<button type="button" class="ride"><i class="xi-bicycle"></i><span>대여하기</span></button>
				</div>
			</div>`
		;

		const closeEl = this.querySelector(`a[role="close-modal"]`);
		closeEl.addEventListener(`click`, e => {
			e.preventDefault();
			this.close();
		});
	}
	close() {
		delete this.dataset.show;
	}
	open() {
		this.dataset.show = `${true}`;
	}
}

export default StationModal;