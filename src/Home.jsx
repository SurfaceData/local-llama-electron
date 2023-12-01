import * as React from "react";

const HomePage = ({}) => {
  const onClick = async () => {
    const success = await window.electronAPI.loadModel();
    console.log(success);
  };

  return (
    <div>
      <div className="text-sm font-bold underline">Hello from React!</div>
      <button onClick={onClick} className="btn btn-primary">
        Load Model
      </button>
    </div>
  );
};

export default HomePage;
