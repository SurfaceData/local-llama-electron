import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuid } from "uuid";

import { Message, MessageRole } from "src/types";
import ChatMessage from "src/chat/ChatMessage";

/**
 * A full chat thread that appends user and assistant messages to the end.
 */
const ChatThread = () => {
  // Leverage react-hook-form to make the thread easier.
  const { register, handleSubmit } = useForm();

  // Stores all messages for presentation.
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);
  // Manages loading state.
  const [loading, setLoading] = useState(false);

  /**
   * Sends a message to the main process and gets the response.
   */
  const sendMessage = async (data) => {
    setLoading(true);

    // Push the new user message to render it while we wait.
    const userMessage = {
      id: uuid(),
      text: data.text,
      role: MessageRole.User,
    };
    setMessageHistory((oldHistory) => [...oldHistory, userMessage]);

    // Waiting!
    const assistantResult = await window.electronAPI.chat(data.text);

    // Push the assistant message for rendering.
    const assistantMessage = {
      id: uuid(),
      text: assistantResult,
      role: MessageRole.Assistant,
    };
    setMessageHistory((oldHistory) => [...oldHistory, assistantMessage]);
    setLoading(false);
  };
  return (
    <div>
      <form onSubmit={handleSubmit(sendMessage)}>
        <input
          type="text"
          className="input input-bordered w-full"
          {...register("text")}
        />

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading && <span className="loading loading-spinner" />}
          Send
        </button>
      </form>

      {messageHistory.map((m) => (
        <ChatMessage key={m.id} message={m} />
      ))}
    </div>
  );
};

export default ChatThread;
