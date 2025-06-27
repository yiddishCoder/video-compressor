import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { webUtils } from 'electron'

// Custom APIs for renderer
const api = {
  // File selection
  selectInputFile: () => ipcRenderer.invoke('select-input-file'),
  selectOutputFile: (defaultName: string) => ipcRenderer.invoke('select-output-file', defaultName),
  selectOutputFileInFolder: (folderPath: string, defaultName: string) => ipcRenderer.invoke('select-output-file-in-folder', folderPath, defaultName),
  checkFileExists: (filePath: string) => ipcRenderer.invoke('check-file-exists', filePath),
  
  // File processing (using webUtils in preload)
  getFilePathFromFile: (file: File) => {
    try {
      return webUtils.getPathForFile(file)
    } catch (error) {
      console.error('Error getting file path:', error)
      return null
    }
  },
  
  // Video processing
  getVideoInfo: (filePath: string) => ipcRenderer.invoke('get-video-info', filePath),
  startEncoding: (options: any) => ipcRenderer.invoke('start-encoding', options),
  cancelEncoding: (outputPath: string) => ipcRenderer.invoke('cancel-encoding', outputPath),
  
  // Progress updates
  onEncodingProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('encoding-progress', (_, progress) => callback(progress))
  },
  
  removeEncodingProgressListener: () => {
    ipcRenderer.removeAllListeners('encoding-progress')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
