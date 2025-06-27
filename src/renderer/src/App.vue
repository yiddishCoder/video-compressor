<script setup lang="ts">
import { reactive, onMounted, onUnmounted } from 'vue'
import FileInput from './components/FileInput.vue'
import EncodingSettings from './components/EncodingSettings.vue'
import FileOutput from './components/FileOutput.vue'
import EncodingProgressModal from './components/EncodingProgressModal.vue'
import EncodingCompletionModal from './components/EncodingCompletionModal.vue'

interface VideoInfo {
  width: number
  height: number
  duration: number
  aspectRatio: number
}

interface ResolutionOption {
  label: string
  height: number
  width: number
}

interface EncodingProgress {
  progress: number
  currentTime: number
  totalTime: number
  estimatedTimeRemaining: number
  isEstimating: boolean
}

interface EncodingResult {
  outputPath: string
  fileSize: number
  resolution: string
  duration: number
}

const state = reactive({
  inputFile: '',
  outputFile: '',
  videoInfo: null as VideoInfo | null,
  resolutions: [] as ResolutionOption[],
  selectedResolution: null as ResolutionOption | null,
  selectedPreset: 3,
  selectedCrf: 24,
  isEncoding: false,
  isLoadingVideoInfo: false,
  encodingProgress: 0,
  encodingCurrentTime: 0,
  encodingTotalTime: 0,
  encodingEstimatedTimeRemaining: 0,
  encodingIsEstimating: true,
  showCompletionModal: false,
  completionResult: null as EncodingResult | null
})

const loadVideoInfo = async (filePath: string) => {
  state.isLoadingVideoInfo = true
  try {
    const result = await window.api.getVideoInfo(filePath)
    if (result.success && result.videoInfo && result.resolutions) {
      state.videoInfo = result.videoInfo
      state.resolutions = result.resolutions
      state.selectedResolution = result.resolutions[0] // Select highest quality by default
    } else {
      alert(`Error loading video info: ${result.error}`)
    }
  } catch (error) {
    alert(`Error loading video info: ${error}`)
  } finally {
    state.isLoadingVideoInfo = false
  }
}

const handleInputFileUpdate = async (filePath: string) => {
  // Check if the new input file is the same as the current output file
  if (filePath && state.outputFile) {
    // Normalize paths for comparison (handle different path separators)
    const normalizedInput = filePath.replace(/\\/g, '/').toLowerCase()
    const normalizedOutput = state.outputFile.replace(/\\/g, '/').toLowerCase()
    
    if (normalizedInput === normalizedOutput) {
      // Clear the output file since it conflicts with the new input
      state.outputFile = ''
      alert('Output file has been cleared because it was the same as the selected input file.')
    }
  }
  
  state.inputFile = filePath
  if (filePath) {
    await loadVideoInfo(filePath)
  } else {
    state.videoInfo = null
    state.resolutions = []
    state.selectedResolution = null
    state.isLoadingVideoInfo = false
  }
}

const handleVideoInfoUpdate = (videoInfo: VideoInfo | null) => {
  state.videoInfo = videoInfo
}

const resetSettings = () => {
  state.selectedPreset = 3 // Reset to medium (default)
  state.selectedCrf = 24 // Reset to balanced quality (default)
  if (state.resolutions.length > 0) {
    state.selectedResolution = state.resolutions[0] // Reset to highest quality
  }
}

const startEncoding = async () => {
  if (!state.inputFile || !state.outputFile || !state.selectedResolution || !state.videoInfo) {
    alert('Please select input file, output file, and resolution')
    return
  }

  state.isEncoding = true
  state.encodingProgress = 0
  state.encodingCurrentTime = 0
  state.encodingTotalTime = 0
  state.encodingEstimatedTimeRemaining = 0
  state.encodingIsEstimating = true
  state.showCompletionModal = false
  state.completionResult = null

  try {
    const presetLabels = ['veryslow', 'slower', 'slow', 'medium', 'fast', 'faster', 'veryfast', 'superfast', 'ultrafast']
    const result = await window.api.startEncoding({
      inputPath: state.inputFile,
      outputPath: state.outputFile,
      targetHeight: state.selectedResolution.height,
      preset: presetLabels[state.selectedPreset],
      crf: state.selectedCrf,
      duration: state.videoInfo.duration
    })

    if (result.success && result.result) {
      state.completionResult = result.result
      state.showCompletionModal = true
    } else if (!result.success) {
      alert(`Encoding failed: ${result.error}`)
    }
  } catch (error) {
    alert(`Encoding error: ${error}`)
  } finally {
    state.isEncoding = false
  }
}

const handleProgressUpdate = (progress: EncodingProgress) => {
  state.encodingProgress = progress.progress
  state.encodingCurrentTime = progress.currentTime
  state.encodingTotalTime = progress.totalTime
  state.encodingEstimatedTimeRemaining = progress.estimatedTimeRemaining
  state.encodingIsEstimating = progress.isEstimating
}

const handleCancelEncoding = async () => {
  try {
    const result = await window.api.cancelEncoding(state.outputFile)
    if (result.success) {
      state.isEncoding = false
      state.encodingProgress = 0
      state.encodingCurrentTime = 0
      state.encodingTotalTime = 0
      state.encodingEstimatedTimeRemaining = 0
      state.encodingIsEstimating = true
    } else {
      alert(`Failed to cancel encoding: ${result.error}`)
    }
  } catch (error) {
    alert(`Error cancelling encoding: ${error}`)
  }
}

const handleCloseCompletionModal = () => {
  state.showCompletionModal = false
  state.completionResult = null
}

const handleResetForm = () => {
  // Reset all form state
  state.inputFile = ''
  state.outputFile = ''
  state.videoInfo = null
  state.resolutions = []
  state.selectedResolution = null
  state.selectedPreset = 3
  state.selectedCrf = 24
  state.isEncoding = false
  state.isLoadingVideoInfo = false
  state.encodingProgress = 0
  state.encodingCurrentTime = 0
  state.encodingTotalTime = 0
  state.encodingEstimatedTimeRemaining = 0
  state.encodingIsEstimating = true
  state.showCompletionModal = false
  state.completionResult = null
}

onMounted(() => {
  window.api.onEncodingProgress(handleProgressUpdate)
})

onUnmounted(() => {
  window.api.removeEncodingProgressListener()
})
</script>

<template>
  <div class="app">
    <main class="main">
      <!-- File Selection Row -->
      <div class="file-row">
        <!-- Input File Selection -->
        <FileInput 
          :input-file="state.inputFile"
          :video-info="state.videoInfo"
          :is-loading="state.isLoadingVideoInfo"
          @update:input-file="handleInputFileUpdate"
          @update:video-info="handleVideoInfoUpdate"
        />

        <!-- Output File Selection -->
        <FileOutput
          :output-file="state.outputFile"
          :is-encoding="state.isEncoding"
          :input-file-name="state.inputFile ? state.inputFile.split('/').pop()?.split('\\').pop() : undefined"
          :input-file-path="state.inputFile"
          @update:output-file="state.outputFile = $event"
        />
      </div>

      <!-- Video Settings -->
      <EncodingSettings
        :video-info="state.videoInfo"
        :resolutions="state.resolutions"
        :selected-resolution="state.selectedResolution"
        :selected-preset="state.selectedPreset"
        :selected-crf="state.selectedCrf"
        :is-encoding="state.isEncoding"
        @update:selected-resolution="state.selectedResolution = $event"
        @update:selected-preset="state.selectedPreset = $event"
        @update:selected-crf="state.selectedCrf = $event"
        @reset="resetSettings"
      />

      <!-- Start Button -->
      <section class="section">
        <button 
          class="btn btn-primary btn-large"
          @click="startEncoding"
          :disabled="!state.inputFile || !state.outputFile || !state.selectedResolution || state.isEncoding"
        >
          {{ state.isEncoding ? 'Encoding...' : 'Start Encoding' }}
        </button>
      </section>
    </main>

    <!-- Encoding Progress Modal -->
    <EncodingProgressModal
      :is-visible="state.isEncoding"
      :progress="state.encodingProgress"
      :current-time="state.encodingCurrentTime"
      :total-time="state.encodingTotalTime"
      :estimated-time-remaining="state.encodingEstimatedTimeRemaining"
      :is-estimating="state.encodingIsEstimating"
      @cancel="handleCancelEncoding"
    />

    <!-- Encoding Completion Modal -->
    <EncodingCompletionModal
      :is-visible="state.showCompletionModal"
      :result="state.completionResult"
      @close="handleCloseCompletionModal"
      @reset="handleResetForm"
    />
  </div>
</template>

<style scoped>
.app {
  width: 98vw;
  margin: 0 auto;
  padding: 10px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  height: 100vh;
  box-sizing: border-box;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main {
  overflow-y: auto;
  max-height: 100vh;
  width: 100%;
}

.file-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.file-row > * {
  flex: 1;
  min-width: 0;
}

.section {
  margin-bottom: 12px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  width: 100%;
}

.section h2 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-large {
  width: 100%;
  padding: 10px;
  font-size: 0.95rem;
  font-weight: 600;
}

/* Responsive adjustments for smaller screens */
@media (max-height: 600px) {
  .app {
    padding: 10px;
  }
  
  .section {
    margin-bottom: 10px;
    padding: 8px;
  }
}
</style>
