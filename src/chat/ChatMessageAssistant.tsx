import * as React from "react";

import { Message } from "src/types";

interface ChatMessageAssistantProps {
  message: Message;
}
/**
 * Renders an assistant message.
 */
const ChatMessageAssistant = ({ message }: ChatMessageAssistantProps) => {
  return (
    <div className="chat chat-start">
      <div className="avatar placeholder">
        <div className="w-8 rounded-full bg-neutral-focus text-neutral-content">
          <span className="text-xs">bot</span>
        </div>
      </div>
      <div className="chat-bubble">{message.text}</div>
    </div>
  );
};

export default ChatMessageAssistant;
