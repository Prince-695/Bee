const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isDesktop: true,
  platform: process.platform,
  showNotification: (title, body) => {
    ipcRenderer.send("app:notify", { title, body });
  },
  selectDirectory: async () => {
    return await ipcRenderer.invoke("app:select-directory");
  },
  getBackendUrl: async () => {
    return await ipcRenderer.invoke("app:get-backend-url");
  },
  minimizeWindow: () => ipcRenderer.send("window:minimize"),
  maximizeWindow: () => ipcRenderer.send("window:maximize"),
  closeWindow: () => ipcRenderer.send("window:close"),
});
