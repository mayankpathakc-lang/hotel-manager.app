const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  query: (args) => ipcRenderer.invoke('db-query', args),
  onDbUpdate: (callback) => ipcRenderer.on('db-update', (event, data) => callback(data))
})
