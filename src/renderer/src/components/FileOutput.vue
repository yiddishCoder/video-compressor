<script setup lang="ts">
import { reactive } from 'vue'

interface Props {
  outputFile: string
  isEncoding: boolean
  inputFileName?: string
  inputFilePath?: string
}

interface Emits {
  (e: 'update:outputFile', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const state = reactive({
  dragOver: false
})

const generateDefaultName = (inputFileName?: string): string => {
  if (!inputFileName) {
    return 'video_encoded.mp4'
  }
  
  // Remove the file extension and add _encoded.mp4
  const nameWithoutExt = inputFileName.replace(/\.[^/.]+$/, '')
  return `${nameWithoutExt}_encoded.mp4`
}

const checkSameFile = (outputPath: string): boolean => {
  if (!props.inputFilePath || !outputPath) return false
  
  // Normalize paths for comparison (handle different path separators)
  const normalizedInput = props.inputFilePath.replace(/\\/g, '/').toLowerCase()
  const normalizedOutput = outputPath.replace(/\\/g, '/').toLowerCase()
  
  return normalizedInput === normalizedOutput
}

const handleOutputSelect = async () => {
  const defaultName = generateDefaultName(props.inputFileName)
  const filePath = await window.api.selectOutputFile(defaultName)
  if (filePath) {
    if (checkSameFile(filePath)) {
      alert('Output file cannot be the same as the input file. Please select a different location.')
      return
    }
    emit('update:outputFile', filePath)
  }
}

const handleRemoveOutput = () => {
  emit('update:outputFile', '')
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
    // console.log('Dropped item:', file)
    // console.log('File type:', file.type)
    // console.log('File name:', file.name)
    
    try {
      // Get the path using the preload method
      const itemPath = window.api.getFilePathFromFile(file)
      // console.log('Item path from preload:', itemPath)
      
      if (itemPath) {
        // Check if it's a directory by examining the file type and name
        // Folders typically have empty type and no extension
        const isLikelyFolder = !file.type && !file.name.includes('.')
        
        if (isLikelyFolder) {
          // It's likely a folder, open the folder and let user choose filename
          const defaultName = generateDefaultName(props.inputFileName)
          const filePath = await window.api.selectOutputFileInFolder(itemPath, defaultName)
          if (filePath) {
            if (checkSameFile(filePath)) {
              alert('Output file cannot be the same as the input file. Please select a different location.')
              return
            }
            emit('update:outputFile', filePath)
          }
        } else {
          // It's likely a file, show error message
          alert('Please drop a folder to select the output location, not a file.')
        }
      } else {
        alert('Could not determine item path. Please use the "Browse" button instead.')
      }
    } catch (error) {
      console.error('Error processing dropped item:', error)
      alert('Error processing dropped item. Please use the "Browse" button instead.')
    }
  }
}
</script>

<template>
  <section class="section">
    <h2>Output File</h2>
    <div 
      class="file-drop-zone"
      :class="{ 'drag-over': state.dragOver }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div v-if="!outputFile" class="drop-zone-content">
        <div class="drop-zone-icon">📁</div>
        <p class="drop-zone-text">Drop a folder here to select output location or</p>
        <button class="btn btn-primary" @click="handleOutputSelect">
          Browse
        </button>
      </div>
      <div v-else class="file-info">
        <div class="file-info-content">
          <div class="file-icon">📄</div>
          <div class="file-details">
            <p class="file-name">{{ outputFile.split('/').pop()?.split('\\').pop() }}</p>
            <p class="file-meta">Output location selected</p>
          </div>
        </div>
        <div class="file-actions">
          <button class="btn btn-secondary" @click="handleOutputSelect" :disabled="isEncoding">
            Change
          </button>
          <button class="btn btn-danger" @click="handleRemoveOutput" :disabled="isEncoding">
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
  background: #3498db;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.file-info-content {
  display: flex;
  align-items: center;
}

.file-icon {
  font-size: 1.2rem;
  margin-right: 10px;
  color: #7f8c8d;
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 0.97rem;
  color: #2c3e50;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 0.8rem;
  color: #7f8c8d;
}

.file-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}
</style> 