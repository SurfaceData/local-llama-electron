import { BrowserWindow, app, dialog, ipcMain } from "electron";
import Store from "electron-store";
import fs from "fs";
import { LlamaChatSession, LlamaContext, LlamaModel } from "node-llama-cpp";
import OpenAI from "openai";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fake for calling llama-cpp-python server with features not yet supported by
 * node-llama-cpp.
 */
const mlmOpenai = new OpenAI({
  apiKey: "sk-xxx",
  baseURL: "http://localhost:8000/v1",
});

/**
 * Fake for calling local-sdxl-turbo server.
 */
const imageOpenai = new OpenAI({
  apiKey: "sk-xxx",
  baseURL: "http://localhost:9000/v1",
});

/**
 * A global cache storage for persistent user data.
 */
const store = new Store();

/**
 * A local Llama Model that we'll be using consistently.
 */
let model = undefined;
/**
 * Structures required by LlamaModel for handling chat sessions.  These get
 * created when the model is loaded.
 */
let modelContext = undefined;
let modelSession = undefined;

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
/**
 * Two way communication with the model.
 */
ipcMain.handle("model-chat", chat);

/**
 * Given an image, produces a text analysis.
 */
ipcMain.handle("image-analyze", analyzeImage);

/**
 * Generates an image given a prompt.
 */
ipcMain.handle("image-generate", generateImage);

/*
 * Saves a base64 image as a PNG file.
 */
ipcMain.handle("image-save", saveImage);

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
function loadModel() {
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
  modelContext = new LlamaContext({ model });
  modelSession = new LlamaChatSession({ context: modelContext });
  return true;
}

/**
 * Prompts the model to respond to the user message in relation to the current
 * session context.
 */
async function chat(event, userMessage) {
  if (!modelSession) {
    throw new Error("Model not loaded");
  }
  const assistantMessage = await modelSession.prompt(userMessage);
  return assistantMessage;
}

/**
 * Triggers an image to text multi-modal model.
 */
async function analyzeImage() {
  // Get yo images.
  const { filePaths } = await dialog.showOpenDialog({
    filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "webp"] }],
    properties: ["openFile"],
  });
  // Later, this should actually call a node-llama-cpp model.  For now we call
  // llama-cpp-python through the OpenAI api.
  const result = await mlmOpenai.chat.completions.create({
    model: "llava-1.5",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "What’s in this image?" },
          {
            type: "image_url",
            image_url: `file://${filePaths[0]}`,
          },
        ],
      },
    ],
  });
  return result.choices[0].message.content;
}

/**
 * Given a prompt, generates an image by calling a remote OpenAI compatible
 * server and returning the base64 representation.
 */
async function generateImage(event, prompt) {
  // Later, this should actually call a node-llama-cpp model.  For now we call
  // llama-cpp-python through the OpenAI api.
  const result = await imageOpenai.images.generate({
    prompt,
    model: "sdxl-turbo",
  });
  return result.data[0].b64_json;
}

/**
 * Given a base64 image representation, opens a save dialog and saves the image
 * in the desired file as a PNG.
 */
async function saveImage(event, image) {
  const { filePath } = await dialog.showSaveDialog();
  if (!filePath) {
    throw new Error("Must select a file for saving");
  }
  fs.writeFileSync(`${filePath}.png`, image, "base64");
}
