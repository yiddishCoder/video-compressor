import { spawn } from 'child_process'
import { getFfmpegPath } from './binary-utils'

import { parseFfmpegProgress } from './video-utils'
import { statSync,/*  existsSync */ } from 'fs'

export interface EncodingOptions {
  inputPath: string
  outputPath: string
  targetHeight: number
  preset: string
  crf: number
  duration: number
}

export interface EncodingProgress {
  progress: number
  currentTime: number
  totalTime: number
  estimatedTimeRemaining: number
  isEstimating: boolean
}

export interface EncodingResult {
  outputPath: string
  fileSize: number
  resolution: string
  duration: number
}

export function encodeVideo(
  options: EncodingOptions,
  onProgress: (progress: EncodingProgress) => void,
  onComplete: (result: EncodingResult) => void,
  onError: (error: string) => void
): () => void {
  const { inputPath, outputPath, targetHeight, preset, crf, duration } = options

  const args = [
    '-i', inputPath,
    '-vf', `scale=trunc(oh*a/2)*2:trunc(${targetHeight}/2)*2`,
    '-preset', preset,
    '-crf', crf.toString(),
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-y', // Overwrite output file
    outputPath
  ]

  console.log('FFmpeg command:', getFfmpegPath(), args.join(' '))

  // Debug: Log the ffmpeg path and check if it exists
  // console.log('FFmpeg path:', getFfmpegPath())
  // console.log('FFmpeg exists:', existsSync(getFfmpegPath() as string))
  // console.log('FFmpeg is file:', existsSync(getFfmpegPath() as string) && statSync(getFfmpegPath() as string).isFile())

  const process = spawn(getFfmpegPath() as string, args)
  let totalStderr = ''
  let wasCancelled = false
  let startTime = Date.now()

  process.stderr.on('data', (data) => {
    const stderr = data.toString()
    totalStderr += stderr

    // Parse progress from stderr
    const currentTime = parseFfmpegProgress(stderr)
    
    // Use the duration we already have from video info
    if (duration > 0 && currentTime > 0) {
      const progress = Math.min((currentTime / duration) * 100, 100)
      
      // Calculate estimated time remaining
      let estimatedTimeRemaining = 0
      let isEstimating = true
      
      // Only show estimates after we have at least 5% progress and 10 seconds of data
      if (progress >= 5) {
        const elapsedTime = (Date.now() - startTime) / 1000 // seconds
        if (elapsedTime >= 10) {
          const progressDecimal = progress / 100
          const totalEstimatedTime = elapsedTime / progressDecimal
          estimatedTimeRemaining = Math.max(0, totalEstimatedTime - elapsedTime)
          isEstimating = false
        }
      }
      
      onProgress({
        progress,
        currentTime,
        totalTime: duration,
        estimatedTimeRemaining,
        isEstimating
      })
    }
  })

  process.on('close', (code) => {
    if (code === 0) {
      // Get file information for completion
      try {
        const stats = statSync(outputPath)
        const fileSize = stats.size
        const width = Math.round(targetHeight * 16 / 9) // Approximate width based on aspect ratio
        const resolution = `${width}x${targetHeight}`
        
        onComplete({
          outputPath,
          fileSize,
          resolution,
          duration
        })
      } catch (error) {
        // Still call onComplete with basic info
        onComplete({
          outputPath,
          fileSize: 0,
          resolution: `${targetHeight}p`,
          duration
        })
      }
    } else if (wasCancelled) {
      // Don't call onError for user cancellation
    } else {
      onError(`FFmpeg process exited with code ${code}: ${totalStderr}`)
    }
  })

  process.on('error', (error) => {
    console.error('FFmpeg spawn error:', error)
    onError(`Failed to spawn FFmpeg: ${error.message}`)
  })

  // Return a function to cancel the encoding
  return () => {
    wasCancelled = true
    process.kill('SIGTERM')
    
    // Give it a moment to terminate gracefully, then force kill if needed
    setTimeout(() => {
      if (!process.killed) {
        process.kill('SIGKILL')
      }
    }, 1000)
  }
} 