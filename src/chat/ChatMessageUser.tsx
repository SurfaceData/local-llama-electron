import * as React from "react";

import { Message } from "src/types";

interface ChatMessageUserProps {
  message: Message;
}

/**
 * Renders an user message.
 */
const ChatMessageUser = ({ message }: ChatMessageUserProps) => {
  return (
    <div className="chat chat-end">
      <div className="chat-bubble">{message.text}</div>
      <div className="avatar placeholder">
        <div className="w-8 rounded-full bg-neutral-focus text-neutral-content">
          <span className="text-xs">you</span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageUser;
