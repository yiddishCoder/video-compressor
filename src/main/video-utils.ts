import { spawn } from 'child_process'
import { getFfprobePath } from './binary-utils'
import { statSync } from 'fs'

const ffprobe = getFfprobePath()
// import { existsSync } from 'fs'

export interface VideoInfo {
  width: number
  height: number
  duration: number
  aspectRatio: number
  fileSize: number
}

export interface ResolutionOption {
  label: string
  height: number
  width: number
}

export async function getVideoInfo(filePath: string): Promise<VideoInfo> {
  const args = [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    filePath
  ]

  const process = spawn(ffprobe, args)
  let stdout = ''
  let stderr = ''

  process.stdout.on('data', (data) => {
    stdout += data.toString()
  })

  process.stderr.on('data', (data) => {
    stderr += data.toString()
  })

  return new Promise((resolve, reject) => {
    process.on('close', (code) => {
      if (code === 0) {
        try {
          const data = JSON.parse(stdout)
          
          const videoStream = data.streams?.find((stream: any) => stream.codec_type === 'video')
          if (!videoStream) {
            reject(new Error('No video stream found'))
            return
          }

          const width = videoStream.width
          const height = videoStream.height
          const duration = parseFloat(data.format.duration)
          const aspectRatio = width / height
          
          // Get file size from filesystem
          let fileSize = 0
          try {
            const stats = statSync(filePath)
            fileSize = stats.size
          } catch (error) {
            console.warn('Could not get file size:', error)
          }

          resolve({
            width,
            height,
            duration,
            aspectRatio,
            fileSize
          })
        } catch (error) {
          reject(new Error(`Failed to parse FFprobe output: ${error}`))
        }
      } else {
        reject(new Error(`FFprobe failed with code ${code}: ${stderr}`))
      }
    })

    process.on('error', (error) => {
      reject(new Error(`Failed to spawn ffprobe: ${error.message}`))
    })
  })
}

export function getAvailableResolutions(sourceHeight: number): ResolutionOption[] {
  const resolutions = [
    { label: '2160p (4K)', height: 2160 },
    { label: '1440p (2K)', height: 1440 },
    { label: '1080p (Full HD)', height: 1080 },
    { label: '720p (HD)', height: 720 },
    { label: '480p (SD)', height: 480 },
    { label: '360p', height: 360 }
  ]

  return resolutions
    .filter(res => res.height <= sourceHeight)
    .map(res => ({
      ...res,
      width: Math.round(res.height * 16 / 9) // Assuming 16:9 aspect ratio for width calculation
    }))
}

export function parseFfmpegProgress(stderr: string): number {
  const timeMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/)
  if (!timeMatch) return 0

  const hours = parseInt(timeMatch[1])
  const minutes = parseInt(timeMatch[2])
  const seconds = parseInt(timeMatch[3])
  const centiseconds = parseInt(timeMatch[4])

  const currentTime = hours * 3600 + minutes * 60 + seconds + centiseconds / 100
  return currentTime
} 