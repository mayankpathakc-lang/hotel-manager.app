const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  query: (params) => ipcRenderer.invoke('db-query', params),
  onDbUpdate: (callback) => {
    const subscription = (event, data) => callback(data)
    ipcRenderer.on('db-update', subscription)
    return () => {
      ipcRenderer.removeListener('db-update', subscription)
    }
  }
})
