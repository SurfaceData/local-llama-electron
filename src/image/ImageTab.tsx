import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuid } from "uuid";

import { Message, MessageRole } from "src/types";
import ChatMessage from "src/chat/ChatMessage";

/**
 * A full chat thread that appends user and assistant messages to the end.
 */
const ImageTab = () => {
  // Leverage react-hook-form to make the thread easier.
  const { register, handleSubmit } = useForm();

  // Manages loading state.
  const [loading, setLoading] = useState(false);

  /**
   * Sends a message to the main process and gets the response.
   */
  const sendMessage = async () => {
    setLoading(true);

    // Waiting!
    const analysis = await window.electronAPI.analyzeImage();
    console.log(analysis);

    setLoading(false);
  };
  return (
    <div>
      <form onSubmit={handleSubmit(sendMessage)}>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading && <span className="loading loading-spinner" />}
          Analyze an Image
        </button>
      </form>
    </div>
  );
};

export default ImageTab;
