import { join } from 'path'
import { app } from 'electron'

export function getBinaryPath(binaryName: 'ffmpeg' | 'ffprobe'): string {
  const platform = process.platform
  const arch = process.arch
  
  // Get the binary extension
  const binaryExt = platform === 'win32' ? '.exe' : ''
  const binaryFile = `${binaryName}${binaryExt}`
  
  // In development, use the bin directory with platform subdirectories
  if (process.env.NODE_ENV === 'development') {
    // Determine the platform key for development
    let platformKey: string
    if (platform === 'win32') {
      platformKey = 'win-x64'
    } else if (platform === 'darwin') {
      platformKey = arch === 'arm64' ? 'mac-arm64' : 'mac-x64'
    } else if (platform === 'linux') {
      platformKey = 'linux-x64'
    } else {
      throw new Error(`Unsupported platform: ${platform}-${arch}`)
    }
    
    const devPath = join(__dirname, '..', '..', 'bin', platformKey, binaryFile)
    return devPath
  }
  
  // In production, use the app directory
  const appPath = app.getAppPath()
  const isPackaged = app.isPackaged
  
  if (isPackaged) {
    // For packaged app, binaries are directly in bin/ (platform-specific via extraResources)
    const prodPath = join(appPath, '..', 'bin', binaryFile)
    return prodPath
  } else {
    // For development builds, use the bin directory with platform subdirectories
    let platformKey: string
    if (platform === 'win32') {
      platformKey = 'win-x64'
    } else if (platform === 'darwin') {
      platformKey = arch === 'arm64' ? 'mac-arm64' : 'mac-x64'
    } else if (platform === 'linux') {
      platformKey = 'linux-x64'
    } else {
      throw new Error(`Unsupported platform: ${platform}-${arch}`)
    }
    
    const devPath = join(appPath, 'bin', platformKey, binaryFile)
    return devPath
  }
}

export function getFfmpegPath(): string {
  return getBinaryPath('ffmpeg')
}

export function getFfprobePath(): string {
  return getBinaryPath('ffprobe')
} 