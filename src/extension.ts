import * as vscode from 'vscode';
import { ChatBuilderEditorProvider } from './chatBuilderEditor';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(...ChatBuilderEditorProvider.register(context));
}
