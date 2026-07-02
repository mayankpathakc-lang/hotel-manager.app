const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { handleDatabaseQuery, dbPath } = require('./database')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: "Joshi Guest House — Hotel Manager",
    icon: path.join(__dirname, '../public/favicon.ico')
  })

  // In development, load localhost. In production, load built dist files.
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  // Register IPC channel for database operations
  ipcMain.handle('db-query', handleDatabaseQuery)
  
  createWindow()

  console.log('Joshi Guest House application started.')
  console.log('Database path:', dbPath)

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
