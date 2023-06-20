import { Chat } from './Chat';
import { ChatCompletionRequestMessage } from 'openai';
import * as vscode from 'vscode';

type Props = {
	messages: ChatCompletionRequestMessage[];
	nonce: string;
	scriptUri: vscode.Uri;
	tailwindUri: vscode.Uri;
	loading: boolean;
}
export function Layout({ 
	tailwindUri,
	messages,
	nonce,
	scriptUri,
	loading,
}: Props) {
	return (
		<html lang="en" className='w-full h-full flex'>
			<head>
				<link href={tailwindUri.toString()} rel="stylesheet" />

				<title>Chat Builder</title>
			</head>
			<body className='w-full h-full flex'>
				<Chat messages={messages} loading={loading}/>

				<script nonce={nonce} src={scriptUri.toString()}></script>
			</body>
		</html>
	);
}

export default Layout;