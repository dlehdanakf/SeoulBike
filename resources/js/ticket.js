import { sendMessageToParent as sendMessage } from "./components/message";

const LANG = {
    ko: {
        0: `이용권 구매`,
        1: `정기권`,
        2: `7일, 30일, 180일, 365일 선택가능`,
        3: `1시간권`,
        4: `선물`,
        5: `구매`,
        6: `2시간권`,
        7: `일일권`,
        8: `대여 1회 별 1매씩 구매가능`,
        9: `단체권`,
        10: `최소 2명에서 최대 5명까지 구매가능`
    },
    en: {
        0: `Buy ticket`,
        1: `Season ticket`,
        2: `7, 30, 180, 365 days`,
        3: `1 hour`,
        4: `Gift`,
        5: `Buy`,
        6: `2 hour`,
        7: `A day pass`,
        8: `You can buy one for each rental`,
        9: `Group ticket`,
        10: `You can purchase at least 2 people and up to 5 people`
    }
};

const EVENT_LISTENER = {
	changeLanguage: function(options) {
        const { language } = options;
        changeLanguage(language);
    }
};

function changeLanguage(option) {
    const langEl = document.querySelectorAll(`[data-lang-num]`);
    langEl.forEach(nodeEl => {
        const { langNum } = nodeEl.dataset;
        nodeEl.innerHTML = `${LANG[option][langNum]}`;
    });
}

const FIRE_EVENT = {
	requestLanguageStatus: function() {
		sendMessage({
			name: `requestLanguageStatus`,
			options: { }
		});
	}
};

document.addEventListener(`DOMContentLoaded`, function() {
    changeLanguage("ko");

    window.addEventListener(`message`, function(e) {
        const { data } = e;
        const { name, options } = data;

        if(
            EVENT_LISTENER.hasOwnProperty(name) &&
            typeof EVENT_LISTENER[name] === `function`
        ) {
            EVENT_LISTENER[name](options);
        }
    });

    FIRE_EVENT.requestLanguageStatus();
});