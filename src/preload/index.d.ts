import { ElectronAPI } from '@electron-toolkit/preload'

interface VideoAPI {
  selectInputFile: () => Promise<string | null>
  selectOutputFile: (defaultName: string) => Promise<string | null>
  selectOutputFileInFolder: (folderPath: string, defaultName: string) => Promise<string | null>
  checkFileExists: (filePath: string) => Promise<boolean>
  getFilePathFromFile: (file: File) => string | null
  getVideoInfo: (filePath: string) => Promise<{
    success: boolean
    videoInfo?: {
      width: number
      height: number
      duration: number
      aspectRatio: number
      fileSize: number
    }
    resolutions?: Array<{
      label: string
      height: number
      width: number
    }>
    error?: string
  }>
  startEncoding: (options: {
    inputPath: string
    outputPath: string
    targetHeight: number
    preset: string
    crf: number
    duration: number
    originalFileSize: number
  }) => Promise<{ 
    success: boolean
    result?: {
      outputPath: string
      fileSize: number
      resolution: string
      duration: number
      originalFileSize: number
    }
    error?: string 
  }>
  cancelEncoding: (outputPath: string) => Promise<{ success: boolean; error?: string }>
  onEncodingProgress: (callback: (progress: {
    progress: number
    currentTime: number
    totalTime: number
    estimatedTimeRemaining: number
    isEstimating: boolean
  }) => void) => void
  removeEncodingProgressListener: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: VideoAPI
  }
}
