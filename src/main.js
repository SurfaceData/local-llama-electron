import {
  BrowserWindow,
  app,
  dialog,
  ipcMain,
  net,
  protocol,
  reigsterFileProtocol,
} from "electron";
import Store from "electron-store";
import fs from "fs";
import { LlamaChatSession, LlamaContext, LlamaModel } from "node-llama-cpp";
import OpenAI from "openai";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * If we want to present local images, we have to register a local protocol and
 * handle it ourselves.  This dodges security issues.
 */
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { bypassCSP: true } },
]);

app.whenReady().then(() => {
  /**
   * Register a handler for the local protocol.  We do the dumb thing of just
   * read the file.  This is not safe in general.
   */
  protocol.handle("app", (req) => {
    const { host, pathname } = new URL(req.url);
    return net.fetch(pathToFileURL(pathname).toString());
  });
});

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
 * Note: Electron docs [1] explains why this is `on` instead of `invoke`.
 * [1]: https://www.electronjs.org/docs/latest/tutorial/ipc#using-ipcrenderersend
 */
ipcMain.on("image-analyze", analyzeImage);

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
  // Note: We could do streaming here but node-llama-cpp doesn't expose a
  // streaming interface.
  return assistantMessage;
}

/**
 * Triggers an image to text multi-modal model.
 *
 * Note: this implements streaming via Electron's legacy two way communication
 * method:
 *    https://www.electronjs.org/docs/latest/tutorial/ipc#using-ipcrenderersend
 *  This seems like the best way to stream results?
 */
async function analyzeImage(event) {
  // Get yo images.
  const { filePaths } = await dialog.showOpenDialog({
    filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "webp"] }],
    properties: ["openFile"],
  });
  // Tell the client side that we got the file and give it our local protocol
  // that's handled properly for electron.
  event.reply("image-analyze-selection", `app://${filePaths[0]}`);
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
    stream: true,
  });
  // Get each returned chunk and return it via the reply callback.  Ideally
  // there should be a request ID so the client can validate each chunk.
  for await (const chunk of result) {
    const content = chunk.choices[0].delta.content;
    if (content) {
      event.reply("image-analyze-reply", {
        content,
        done: false,
      });
    }
  }
  // Let the callback know that we're done.
  event.reply("image-analyze-reply", {
    content: "",
    done: true,
  });
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
