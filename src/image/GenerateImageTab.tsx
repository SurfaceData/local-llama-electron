import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuid } from "uuid";

import { Message, MessageRole } from "src/types";
import ChatMessage from "src/chat/ChatMessage";

/**
 * A full chat thread that appends user and assistant messages to the end.
 */
const GenerateImageTab = () => {
  // Leverage react-hook-form to make the thread easier.
  const { register, handleSubmit } = useForm();

  // Manages loading state.
  const [loading, setLoading] = useState<boolean>(false);
  const [image, setImage] = useState<string | undefined>(undefined);

  /**
   * Sends a message to the main process and gets the response.
   */
  const generateImage = async (data) => {
    setLoading(true);

    // Waiting!
    const imageB64 = await window.electronAPI.generateImage(data.prompt);
    setImage(imageB64);

    setLoading(false);
  };

  const saveImage = async () => {
    setLoading(true);

    // Waiting!
    const imageB64 = await window.electronAPI.saveImage(image);

    setLoading(false);
  };
  return (
    <div>
      <form onSubmit={handleSubmit(generateImage)}>
        <input
          type="prompt"
          className="input input-bordered w-full"
          {...register("prompt")}
        />

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading && <span className="loading loading-spinner" />}
          Generate
        </button>
      </form>
      {image && (
        <>
          <img src={`data:image/png;base64, ${image}`} />
          <button
            onClick={saveImage}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading && <span className="loading loading-spinner" />}
            Save
          </button>
        </>
      )}
    </div>
  );
};

export default GenerateImageTab;
