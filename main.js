const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { handleDatabaseQuery, dbPath } = require('./database')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Joshi Guest House',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Load the built app index.html
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }

  // Handle print requests
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('App loaded database path:', dbPath)
  })
}

// Register IPC handlers
ipcMain.handle('db-query', handleDatabaseQuery)

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
