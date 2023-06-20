import * as vscode from 'vscode';
import { z } from 'zod';
import { getNonce, renderJSXToHTML, setApiKey, getApiKey, messageSchema, messagesSchema } from './util';
import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { Configuration, OpenAIApi } from "openai";
import Layout from './components/Layout';
import { IncomingMessage } from 'http';

/**
 * Provider for cat scratch editors.
 * 
 * Cat scratch editors are used for `.cscratch` files, which are just json files.
 * To get started, run this extension and open an empty `.cscratch` file in VS Code.
 * 
 * This provider demonstrates:
 * 
 * - Setting up the initial webview for a custom editor.
 * - Loading scripts and styles in a custom editor.
 * - Synchronizing changes between a text document and a custom editor.
 */
export class ChatBuilderEditorProvider implements vscode.CustomTextEditorProvider {
	public static register(context: vscode.ExtensionContext): vscode.Disposable[] {
		const commandDisposable = vscode.commands.registerCommand('chatBuilder.enterOpenAiApiKey', async () => {
			const apiKey = await vscode.window.showInputBox({ prompt: 'Enter OpenAI API Key' });
			if (apiKey) {
				await setApiKey(apiKey);
				vscode.window.showInformationMessage('API Key saved successfully');
			}
		});
		const customEditorDisposable = vscode.window.registerCustomEditorProvider(
			'ChatBuilder.main',
			new ChatBuilderEditorProvider(context)
		);
		const customEditorDisposable2 = vscode.window.registerCustomEditorProvider(
			'ChatBuilder.json',
			new ChatBuilderEditorProvider(context)
		);
		return [commandDisposable, customEditorDisposable, customEditorDisposable2];
	}

	constructor(
		private readonly context: vscode.ExtensionContext
	) { }

	/**
	 * Called when our custom editor is opened.
	 * 
	 * 
	 */
	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};

		// Render the initial html
		const updateWebview = async (messages: z.infer<typeof messagesSchema>, loading: boolean = false) => {
			webviewPanel.webview.html = await this.getHtmlForChat(webviewPanel.webview, messages, loading);
		}
		const updateWebviewSafe = async (text: string = document.getText(), loading: boolean = false) => {
			const messages = messagesSchema.safeParse(JSON.parse(text || "[]"));
			if (messages.success) {
				return updateWebview(messages.data, loading);
			}
		}
		await updateWebviewSafe()

		// Hook up event handlers so that we can synchronize the webview with the text document.
		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				updateWebviewSafe();
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(async e => {
			switch (e.type) {
				case 'add':
					const segements = document.fileName.split('.');
					let model = segements.slice(1, segements.length).join('.');
					if (model.endsWith('json')) {
						model = model.slice(0, model.length - 5)
					}
					console.log("model", model);
					let messages = this.addNewMessage(document, e.content) || [];
					await updateWebview(messages, true);
					// Call out to open ai to get a chat completion
					const openai = new OpenAIApi(new Configuration({ apiKey: getApiKey() }));
					const completion = await openai.createChatCompletion({ model, messages, stream: true }, { responseType: 'stream' });
					const stream = completion.data as unknown as IncomingMessage;
					let chunks: string = '';
					stream.on('data', (chunk: Buffer) => {
						const payloads = chunk.toString().split("\n\n");
						for (const payload of payloads) {
							if (payload.includes('[DONE]')) return;
							if (payload.startsWith("data:")) {
								const data = JSON.parse(payload.replace("data: ", ""));
								try {
									const chunk: undefined | string = data.choices[0].delta?.content;
									if (chunk) {
										chunks += chunk;
										// TODO: stream through the IPC and render on the client side
										// - wil fix scroll bugs and is just right
										updateWebview([...messages, {
											role: "assistant",
											content: chunks,
											name: undefined
										} as const], true);
									}
								} catch (error) {
									console.log(`Error with JSON.parse and ${payload}.\n${error}`);
								}
							}
						}
					});

					stream.on('end', () => {
						setTimeout(() => {
							console.log('\nStream done', chunks);
							this.addNewMessage(document, chunks, "assistant");
							updateWebview([...messages, {
								role: "assistant",
								content: chunks,
								name: undefined
							} as const]);
						}, 10);
					});

					stream.on('error', (err: Error) => {
						console.log(err);
					});

					return;

				case 'delete':
					updateWebview(this.deleteMessage(document, e.id) || []);
					return;
			}
		});
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private async getHtmlForChat(webview: vscode.Webview, messages: z.infer<typeof messagesSchema>, loading: boolean = false): Promise<string> {
		// Local path to script and css for the webview
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'main.js'));

		const tailwindUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'tailwind.css'));

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

		return renderJSXToHTML(
			<Layout
				messages={messages}
				nonce={nonce}
				scriptUri={scriptUri}
				tailwindUri={tailwindUri}
				loading={false}
			/>,
		);
	}

	private addNewMessage(document: vscode.TextDocument, content: string, role: ChatCompletionRequestMessageRoleEnum = "user") {
		const json = messagesSchema.safeParse(this.getDocumentAsJson(document));
		if (!json.success) {
			return;
		}
		const newMessages = [...json.data, {
			role,
			content,
			name: undefined
		} as const]
		this.updateTextDocument(document, newMessages);
		return newMessages;
	}

	private deleteMessage(document: vscode.TextDocument, index: number) {
		const json = messagesSchema.safeParse(this.getDocumentAsJson(document));
		if (!json.success) {
			return;
		}
		const newMessages = json.data.filter((_, i) => i !== index);
		this.updateTextDocument(document, newMessages);
		return newMessages;
	}

	/**
	 * Try to get a current document as json text.
	 */
	private getDocumentAsJson(document: vscode.TextDocument) {
		const text = document.getText();

		if (text.trim().length === 0) {
			return [];
		}

		try {
			return JSON.parse(text);
		} catch {
			throw new Error('Could not get document as json. Content is not valid json');
		}
	}

	/**
	 * Write out the json to a given document.
	 */
	private updateTextDocument(document: vscode.TextDocument, json: any) {
		const edit = new vscode.WorkspaceEdit();

		// Just replace the entire document every time for this example extension.
		// A more complete extension should compute minimal edits instead.
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			JSON.stringify(json, null, 2));

		return vscode.workspace.applyEdit(edit);
	}
}
