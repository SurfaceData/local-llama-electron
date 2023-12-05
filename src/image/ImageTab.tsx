import * as React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

/**
 * A full chat thread that appends user and assistant messages to the end.
 */
const ImageTab = () => {
  // Leverage react-hook-form to make the thread easier.
  const { handleSubmit } = useForm();

  // Manages loading state.
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  /**
   * Sends a message to the main process and gets the response.
   */
  const sendMessage = () => {
    setLoading(true);

    setResult("");
    // Waiting!
    window.electronAPI.analyzeImage();
  };

  useEffect(() => {
    window.electronAPI.onAnalyzeImageReply((chunk) => {
      if (!chunk) {
        return;
      }
      const { content, done } = chunk;
      setResult((oldResult) => (oldResult += content));
      if (done) {
        setLoading(false);
      }
    });
  }, [setResult, setLoading]);

  return (
    <div>
      <form onSubmit={handleSubmit(sendMessage)}>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading && <span className="loading loading-spinner" />}
          Analyze an Image
        </button>
      </form>
      <div>{result}</div>
    </div>
  );
};

export default ImageTab;
