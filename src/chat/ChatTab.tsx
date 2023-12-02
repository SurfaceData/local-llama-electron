import * as React from "react";
import { useState } from "react";

import ChatThread from "src/chat/ChatThread";

/**
 * A demonstration of a chat interface with a local model.
 */
const ChatTab = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

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

// Just export the main page and nothing else.
export default ChatTab;
