import * as React from "react";

import { Message, MessageRole } from "src/types";
import ChatMessageAssistant from "src/chat/ChatMessageAssistant";
import ChatMessageUser from "src/chat/ChatMessageUser";

interface ChatMessageProps {
  message: Message;
}

/**
 * Handy switch between different message presentation types.
 */
const ChatMessage = ({ message }: ChatMessageProps) => {
  if (message.role === MessageRole.User) {
    return <ChatMessageUser message={message} />;
  }
  if (message.role === MessageRole.Assistant) {
    return <ChatMessageAssistant message={message} />;
  }
  return <></>;
};

export default ChatMessage;
