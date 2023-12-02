// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  loadModel: () => ipcRenderer.invoke("model-load"),
  chat: (userMessage) => ipcRenderer.invoke("model-chat", userMessage),
  analyzeImage: () => ipcRenderer.invoke("image-analyze"),
});
