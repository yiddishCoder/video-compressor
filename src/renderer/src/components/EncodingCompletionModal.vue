<script setup lang="ts">
interface Props {
  isVisible: boolean
  result: {
    outputPath: string
    fileSize: number
    resolution: string
    duration: number
  } | null
}

interface Emits {
  (e: 'close'): void
  (e: 'reset'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getFileName = (filePath: string): string => {
  return filePath.split('/').pop()?.split('\\').pop() || filePath
}

const handleClose = () => {
  emit('close')
}

const handleReset = () => {
  emit('reset')
}
</script>

<template>
  <div v-if="isVisible && result" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>✅ Encoding Complete!</h2>
        <button class="modal-close" @click="handleClose">×</button>
      </div>
      
      <div class="completion-content">
        <div class="success-icon">🎉</div>
        
        <div class="file-info">
          <h3>File Information</h3>
          
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">File Name:</span>
              <span class="info-value">{{ getFileName(result.outputPath) }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Resolution:</span>
              <span class="info-value">{{ result.resolution }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Duration:</span>
              <span class="info-value">{{ formatDuration(result.duration) }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">File Size:</span>
              <span class="info-value">{{ formatFileSize(result.fileSize) }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Location:</span>
              <span class="info-value file-path">{{ result.outputPath }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-actions">
        <button class="btn btn-primary" @click="handleReset">
          Great!
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  color: #27ae60;
  font-size: 1.3rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #7f8c8d;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #f8f9fa;
  color: #e74c3c;
}

.completion-content {
  text-align: center;
  margin-bottom: 24px;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  animation: bounce 0.6s ease-in-out;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.file-info {
  text-align: left;
}

.file-info h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ecf0f1;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #7f8c8d;
  font-size: 0.9rem;
  min-width: 80px;
}

.info-value {
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.9rem;
  text-align: right;
  flex: 1;
  margin-left: 16px;
}

.file-path {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  word-break: break-all;
  color: #3498db;
}

.modal-actions {
  display: flex;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.btn-primary {
  background: #27ae60;
  color: white;
}

.btn-primary:hover {
  background: #229954;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(39, 174, 96, 0.3);
}
</style> 