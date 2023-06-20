import * as vscode from 'vscode';
import { z } from 'zod';
import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import * as React from 'react';
const escapeHtml = require("escape-html");

export const messageSchema = z.object({
	role: z.nativeEnum(ChatCompletionRequestMessageRoleEnum),
	content: z.string().optional(),
	name: z.string().optional(),
});
export const messagesSchema = z.array(messageSchema);

export function getApiKey(): string {
	const config = vscode.workspace.getConfiguration('chatBuilder');
	const apiKey = config.get<string>('openaiApiKey');
	return apiKey || '';
}

export function setApiKey(apiKey: string): Thenable<void> {
	const config = vscode.workspace.getConfiguration('chatBuilder');
	return config.update('openaiApiKey', apiKey, vscode.ConfigurationTarget.Global);
}

export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

// Original renderJSXToHTML function taken from:
// https://github.com/reactwg/server-components/discussions/5
// - doesn't support fragments
// - class names compose wrong
// Fixed by:
// https://chat.openai.com/share/45910dae-0f39-4f3d-9c45-bda46d733a83
export async function renderJSXToHTML(jsx: any): Promise<string> {
	if (typeof jsx === "string" || typeof jsx === "number") {
	  return escapeHtml(jsx);
	} else if (jsx == null || typeof jsx === "boolean") {
	  return "";
	} else if (Array.isArray(jsx)) {
	  const childHtmls = await Promise.all(
		jsx.map((child) => renderJSXToHTML(child))
	  );
	  return childHtmls.join("");
	} else if (typeof jsx === "object") {
	  if (jsx.$$typeof === Symbol.for("react.element")) {
		if (jsx.type === React.Fragment) {
		  return renderJSXToHTML(jsx.props.children);
		} else if (typeof jsx.type === "string") {
		  let html = "<" + jsx.type;
		  for (const propName in jsx.props) {
			if (jsx.props.hasOwnProperty(propName) && propName !== "children") {
			  html += " ";
			  if (propName === "className") {
			    html += "class";
			  } else {
			    html += propName;
			  }
			  html += '="';
			  html += escapeHtml(jsx.props[propName]);
			  html += '"';
			}
		  }
		  html += ">";
		  html += await renderJSXToHTML(jsx.props.children);
		  html += "</" + jsx.type + ">";
		  return html;
		} else if (typeof jsx.type === "function") {
		  const Component = jsx.type;
		  const props = jsx.props;
		  const returnedJsx = await Component(props);
		  return renderJSXToHTML(returnedJsx);
		} else throw new Error("Not implemented.");
	  } else throw new Error("Cannot render an object.");
	} else throw new Error("Not implemented.");
}
