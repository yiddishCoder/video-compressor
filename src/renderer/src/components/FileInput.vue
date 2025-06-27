<script setup lang="ts">
import { reactive } from 'vue'

interface VideoInfo {
  width: number
  height: number
  duration: number
  aspectRatio: number
}

interface Props {
  inputFile: string
  videoInfo: VideoInfo | null
  isLoading?: boolean
}

interface Emits {
  (e: 'update:inputFile', value: string): void
  (e: 'update:videoInfo', value: VideoInfo | null): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const state = reactive({
  dragOver: false
})

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const handleFileSelect = async () => {
  const filePath = await window.api.selectInputFile()
  if (filePath) {
    emit('update:inputFile', filePath)
    await loadVideoInfo(filePath)
  }
}

const handleRemoveInput = () => {
  emit('update:inputFile', '')
  emit('update:videoInfo', null)
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  state.dragOver = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  state.dragOver = false
}

const handleDrop = async (e: DragEvent) => {
  e.preventDefault()
  state.dragOver = false
  
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    
    try {
      // Get the path using the preload method
      const filePath = window.api.getFilePathFromFile(file)
      
      if (filePath) {
        await loadVideoInfo(filePath)
      } else {
        // Fallback to file input
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'video/*'
        input.onchange = (e) => {
          const target = e.target as HTMLInputElement
          if (target.files && target.files[0]) {
            loadVideoInfo(target.files[0].path)
          }
        }
        input.click()
      }
    } catch (error) {
      console.error('Error processing dropped file:', error)
      alert('Error processing dropped file. Please use the "Choose File" button instead.')
    }
  }
}

const loadVideoInfo = async (filePath: string) => {
  try {
    const result = await window.api.getVideoInfo(filePath)
    
    if (result.success && result.videoInfo && result.resolutions) {
      emit('update:inputFile', filePath)
      emit('update:videoInfo', result.videoInfo)
    } else {
      alert(`Error loading video info: ${result.error}`)
    }
  } catch (error) {
    alert(`Error loading video info: ${error}`)
  }
}
</script>

<template>
  <section class="section">
    <h2>Input Video</h2>
    <div 
      class="file-drop-zone"
      :class="{ 'drag-over': state.dragOver }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div v-if="!inputFile" class="drop-zone-content">
        <div class="drop-zone-icon">📁</div>
        <p class="drop-zone-text">Drag and drop a video file here or</p>
        <button class="btn btn-primary" @click="handleFileSelect">
          Choose File
        </button>
      </div>
      <div v-else class="file-info">
        <div class="file-info-content">
          <div class="file-icon">🎬</div>
          <div class="file-details">
            <p class="file-name">{{ inputFile.split('/').pop()?.split('\\').pop() }}</p>
            <div v-if="isLoading" class="loading-info">
              <div class="loading-spinner"></div>
              <p class="loading-text">Analyzing video...</p>
            </div>
            <p v-else-if="videoInfo" class="file-meta">
              {{ videoInfo.width }}×{{ videoInfo.height }} • 
              {{ formatDuration(videoInfo.duration) }}
            </p>
          </div>
        </div>
        <div class="file-actions">
          <button class="btn btn-secondary" @click="handleFileSelect" :disabled="isLoading">
            Change
          </button>
          <button class="btn btn-danger" @click="handleRemoveInput" :disabled="isLoading">
            Remove
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  margin-bottom: 15px;
  padding: 12px;
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

.file-drop-zone {
  border: 2px dashed #bdc3c7;
  border-radius: 6px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
  background: white;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.file-drop-zone.drag-over {
  border-color: #3498db;
  background: #ecf0f1;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-height: 80px;
  justify-content: center;
}

.drop-zone-text {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 600;
}

.drop-zone-icon {
  font-size: 1.5rem;
}

.file-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 80px;
  justify-content: center;
}

.file-info-content {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  justify-content: center;
}

.file-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  width: 30px;
  text-align: center;
}

.file-details {
  flex: 1;
  text-align: center;
  min-width: 0;
  max-width: 600px;
}

.file-name {
  font-weight: 600;
  margin: 0 0 3px 0;
  color: #2c3e50;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.8rem;
}

.loading-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e9ecef;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.8rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.file-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  margin-top: 8px;
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

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}
</style> 