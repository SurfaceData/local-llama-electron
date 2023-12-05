import * as React from "react";

import ChatTab from "src/chat/ChatTab";
import GenerateImageTab from "src/image/GenerateImageTab";
import ImageTab from "src/image/ImageTab";

/**
 * A basic home page that allows the user to load a message and then chat with
 * a model.
 */
const HomePage = () => {
  return (
    <div>
      <div role="tablist" className="tabs tabs-bordered">
        <input
          type="radio"
          name="my_tabs_1"
          role="tab"
          className="tab"
          aria-label="Chat"
          defaultChecked
        />
        <div role="tabpanel" className="tab-content p-10">
          <ChatTab />
        </div>

        <input
          type="radio"
          name="my_tabs_1"
          role="tab"
          className="tab"
          aria-label="Image"
        />
        <div role="tabpanel" className="tab-content p-10">
          <ImageTab />
        </div>

        <input
          type="radio"
          name="my_tabs_1"
          role="tab"
          className="tab"
          aria-label="Generate Image"
        />
        <div role="tabpanel" className="tab-content p-10">
          <GenerateImageTab />
        </div>
      </div>
    </div>
  );
};

// Just export the main page and nothing else.
export default HomePage;
