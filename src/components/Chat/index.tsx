import * as React from "react";
import { ChatCompletionRequestMessage } from "openai";
import BubbleList from "./BubbleList";
import Bubble from "./Bubble";

type Props = {
  messages: ChatCompletionRequestMessage[];
  onMessageSend?: (message: string) => void;
  loading?: boolean;
};

export const Chat = ({ messages, onMessageSend, loading }: Props) => (
  <div className="w-full h-full flex flex-col justify-end">
    <BubbleList messages={messages} loading={loading} />
    <div className="add-button join w-full bottom-2 px-2 mb-2">
      <input className="input input-bordered border-2 join-item w-full rounded-l-full" placeholder="Type a message.."/>
      <button className="btn join-item rounded-r-full">Send</button>
    </div>
  </div>
);
Chat.BubbleList = BubbleList;
Chat.Bubble = Bubble;

export default Chat;
