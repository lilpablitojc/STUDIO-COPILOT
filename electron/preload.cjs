// Preload seguro para Studio Copilot (Pablito Studios)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('studioCopilotDesktop', {
  isDesktop: true,
  getDesktopInfo: () => ipcRenderer.invoke('desktop:get-info'),
});
