import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuid } from "uuid";

/**
 * A basic home page that allows the user to load a message and then chat with
 * a model.
 */
const HomePage = ({}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /**
   * Loads the model.  If successfull the chat UI will be revealed.
   */
  const onClick = async () => {
    setLoading(true);
    const loadSuccess = await window.electronAPI.loadModel();
    setLoading(false);
    setSuccess(loadSuccess);
  };

  return (
    <div>
      <div className="text-sm font-bold underline">Hello from React!</div>
      {!success && (
        <button
          onClick={onClick}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading && <span className="loading loading-spinner" />}
          Load Model
        </button>
      )}
      {success && <ChatThread />}
    </div>
  );
};

/**
 * A full chat thread that appends user and assistant messages to the end.
 */
const ChatThread = () => {
  // Leverage react-hook-form to make the thread easier.
  const { register, handleSubmit } = useForm();

  // Stores all messages for presentation.
  const [messageHistory, setMessageHistory] = useState([]);
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
      role: "USER",
    };
    setMessageHistory((oldHistory) => [...oldHistory, userMessage]);

    // Waiting!
    const assistantResult = await window.electronAPI.chat(data.text);

    // Push the assistant message for rendering.
    const assistantMessage = {
      id: uuid(),
      text: assistantResult,
      role: "ASSISTANT",
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

/**
 * Handy switch between different message presentation types.
 */
const ChatMessage = ({ message }) => {
  if (message.role === "USER") {
    return <ChatMessageUser message={message} />;
  }
  if (message.role === "ASSISTANT") {
    return <ChatMessageAssistant message={message} />;
  }
  return <></>;
};

/**
 * Renders an assistant message.
 */
const ChatMessageAssistant = ({ message }) => {
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

/**
 * Renders an user message.
 */
const ChatMessageUser = ({ message }) => {
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

// Just export the main page and nothing else.
export default HomePage;
