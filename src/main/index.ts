import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getVideoInfo, getAvailableResolutions } from './video-utils'
import { encodeVideo } from './ffmpeg-wrapper'
import { existsSync, unlinkSync } from 'fs'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 750,
    resizable: false,
    show: false,
    autoHideMenuBar: true,
    title: 'Video Compressor',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => {})

  // File selection IPC handlers
  ipcMain.handle('select-input-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Video Files', extensions: ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'] }
      ]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('select-output-file', async (_, defaultName: string) => {
    const result = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters: [
        { name: 'MP4 Files', extensions: ['mp4'] }
      ]
    })
    if (result.canceled) return null
    let filePath = result.filePath
    if (filePath && !filePath.toLowerCase().endsWith('.mp4')) {
      filePath += '.mp4'
    }
    return filePath
  })

  ipcMain.handle('select-output-file-in-folder', async (_, folderPath: string, defaultName: string) => {
    const result = await dialog.showSaveDialog({
      defaultPath: `${folderPath}/${defaultName}`,
      filters: [
        { name: 'MP4 Files', extensions: ['mp4'] }
      ]
    })
    if (result.canceled) return null
    let filePath = result.filePath
    if (filePath && !filePath.toLowerCase().endsWith('.mp4')) {
      filePath += '.mp4'
    }
    return filePath
  })

  ipcMain.handle('check-file-exists', async (_, filePath: string) => {
    return existsSync(filePath)
  })

  // Video info IPC handler
  ipcMain.handle('get-video-info', async (_, filePath: string) => {
    try {
      const videoInfo = await getVideoInfo(filePath)
      const resolutions = getAvailableResolutions(videoInfo.height)
      return { success: true, videoInfo, resolutions }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Encoding IPC handler
  ipcMain.handle('start-encoding', async (event, options) => {
    return new Promise((resolve) => {
      const cancelEncoding = encodeVideo(
        options,
        (progress) => {
          event.sender.send('encoding-progress', progress)
        },
        (result) => {
          resolve({ success: true, result })
        },
        (error) => {
          resolve({ success: false, error })
        }
      )

      // Store the cancel function so it can be called later
      ;(event.sender as any).cancelEncoding = cancelEncoding
    })
  })

  // Cancel encoding IPC handler
  ipcMain.handle('cancel-encoding', async (event, outputPath: string) => {
    const cancelFunction = (event.sender as any).cancelEncoding
    if (cancelFunction) {
      cancelFunction()
      ;(event.sender as any).cancelEncoding = null
      
      // Delete the output file if it exists
      try {
        if (existsSync(outputPath)) {
          unlinkSync(outputPath)
        }
      } catch (error) {
        // Silently handle file deletion errors
      }
      
      return { success: true }
    }
    return { success: false, error: 'No encoding process to cancel' }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
