export function sendMessageToChild(nodeEl, { name, options }) {
	if(
		nodeEl !== undefined &&
		typeof nodeEl === `object` &&
		nodeEl.nodeName === `IFRAME`
	) {
		nodeEl.contentWindow.postMessage({ name, options }, `*`);
	}
}
export function sendMessageToParent({ name, options }) {
	window.parent.postMessage({ name, options }, `*`);
}