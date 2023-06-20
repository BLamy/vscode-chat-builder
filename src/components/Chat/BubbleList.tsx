"use client"; // TODO wait til dan abramov tells me to use client components
import * as React from "react";
import { ChatCompletionRequestMessage } from "openai";
import Bubble from "./Bubble";

type Props = {
  messages: ChatCompletionRequestMessage[];
  loading?: boolean;
};

export const ChatBubbleList: React.FC<Props> = ({ messages, loading }) => {
  // const chatContainerRef = React.useRef<HTMLDivElement | null>(null);

  // React.useEffect(() => {
  //   if (chatContainerRef.current) {
  //     const chatContainer = chatContainerRef.current;
  //     const scrollHeight = chatContainer.scrollHeight;
  //     const clientHeight = chatContainer.clientHeight;

  //     chatContainer.scrollTo({
  //       top: scrollHeight - clientHeight,
  //       behavior: "smooth",
  //     });
  //   }
  // }, [messages]);

  return (
    <div className="w-full h-full overflow-y-scroll">
      <div className="mx-4 pb-2">
        {messages.map((message, index) => (
          <Bubble
            key={message.content}
            role={message.role}
            content={message.content}
            name={message.name}
            index={index}
          />
        ))}
        {loading && (
          <Bubble
            key="loading"
            role="assistant"
            content="..."
            name="Chat Builder"
          />
        )}
      </div>
    </div>
  );
};

export default ChatBubbleList;
