// @ts-check

// Script run within the webview itself.
(function () {

	// Get a reference to the VS Code webview api.
	// We use this API to post messages back to our extension.

	// @ts-ignore
	const vscode = acquireVsCodeApi();

	const addButtonContainer = document.querySelector('.add-button');
	const addButton = addButtonContainer?.querySelector('button');
	const input = addButtonContainer?.querySelector('input');
	addButton?.addEventListener('click', () => {
		vscode.postMessage({
			type: 'add',
			content: input?.value,
		});
	})
	input?.addEventListener('keydown', function (event) {
		if (event.key === 'Enter') {
			// prevent the default behavior (form submission, etc.)
			event.preventDefault();
			// log the current value of the input field
			vscode.postMessage({
				type: 'add',
				content: input?.value,
			});
		}
	});


	// // Handle messages sent from the extension to the webview
	// window.addEventListener('message', event => {
	// 	console.log(event);
	// 	const message = event.data; // The json data that the extension sent
	// 	switch (message.type) {
	// 		case 'update':
	// 			const text = message.text;

	// 			// Then persist state information.
	// 			// This state is returned in the call to `vscode.getState` below when a webview is reloaded.
	// 			vscode.setState({ text });

	// 			return;
	// 	}
	// });

	// // Webviews are normally torn down when not visible and re-created when they become visible again.
	// // State lets us save information across these re-loads
	// const state = vscode.getState();
	// if (state) {
	// 	updateContent(state.text);
	// }
}());


