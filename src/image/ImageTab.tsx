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
  const [image, setImage] = useState<string | undefined>(undefined);
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
    /**
     * Register a unique handler that will capture the response chunks and display them.
     */
    window.electronAPI.onAnalyzeImageReply((chunk) => {
      if (!chunk) {
        return;
      }
      const { content, done } = chunk;
      // Use React's function method to do an update with respect to the old
      // state value.  This is best practice.
      setResult((oldResult) => (oldResult += content));
      if (done) {
        setLoading(false);
      }
    });
    /**
     * Register a unique handler to handle the user's selected image path and render it.
     */
    window.electronAPI.onAnalyzeImageSelection((imagePath) => {
      if (!imagePath) {
        return;
      }
      setImage(imagePath);
    });
  }, [setImage, setResult, setLoading]);

  return (
    <div>
      {image && <img src={image} />}
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
