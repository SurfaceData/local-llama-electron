import { app, BrowserWindow, ipcMain } from "electron";
import Store from "electron-store";
import fs from "fs";
import { LlamaModel } from "node-llama-cpp";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * A global cache storage for persistent user data.
 */
const store = new Store();

/**
 * A local Llama Model that we'll be using consistently.
 */
let model = undefined;

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

/**
 * Loads a LLama Model
 */
ipcMain.handle("model-load", loadModel);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/**
 * Initialize the model configuration on the first run.
 */
const modelDir = store.get("model_dir");
if (!modelDir) {
  const defaultModelDir = path.join(
    os.homedir(),
    ".cache/local-llama-electron"
  );
  fs.mkdirSync(defaultModelDir, { recursive: true });
  store.set("model_dir", defaultModelDir);
}

/**
 * Checks the model cache dir and loads a model if available.
 */
async function loadModel() {
  const modelDir = store.get("model_dir");
  if (!modelDir) {
    return false;
  }
  model = new LlamaModel({
    // Make this a configurable thing.
    modelPath: path.join(
      modelDir,
      "hermes-trismegistus-mistral-7b.Q5_K_M.gguf"
    ),
  });
  return true;
}
