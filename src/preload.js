// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  loadModel: () => ipcRenderer.invoke("model-load"),
  chat: (userMessage) => ipcRenderer.invoke("model-chat", userMessage),
  /**
   * Registers a single callback to handle all message streams for image
   * analysis results.  We can't do this on a per request basis because all
   * callbacks get saved.
   */
  onAnalyzeImageReply: (callback) =>
    ipcRenderer.on("image-analyze-reply", (_, arg) => callback(arg)),
  onAnalyzeImageSelection: (callback) =>
    ipcRenderer.on("image-analyze-selection", (_, arg) => callback(arg)),
  analyzeImage: () => ipcRenderer.send("image-analyze"),
  generateImage: (prompt) => ipcRenderer.invoke("image-generate", prompt),
  saveImage: (image) => ipcRenderer.invoke("image-save", image),
  sampleStream: async (message, callback) => {
    ipcRenderer.on("stream-reply", (_, arg) => callback(arg));
    await ipcRenderer.send("stream-sample", message);
  },
});
