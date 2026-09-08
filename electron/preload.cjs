const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  checkForUpdateFile: () => ipcRenderer.invoke('check-for-update-file'),
  deleteUpdateFile: () => ipcRenderer.invoke('delete-update-file')
});
