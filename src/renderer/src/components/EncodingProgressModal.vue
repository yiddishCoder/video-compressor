<script setup lang="ts">
interface Props {
  isVisible: boolean
  progress: number
  currentTime: number
  totalTime: number
  estimatedTimeRemaining: number
  isEstimating: boolean
}

interface Emits {
  (e: 'cancel'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const handleCancel = () => {
  if (confirm('Are you sure you want to cancel the encoding? The output file will be deleted.')) {
    emit('cancel')
  }
}
</script>

<template>
  <div v-if="isVisible" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Encoding Video</h2>
        <button class="modal-close" @click="handleCancel">×</button>
      </div>
      
      <div class="progress-section">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        
        <div class="progress-info">
          <div class="progress-percentage">{{ Math.round(progress) }}%</div>
          <div class="progress-time">
            {{ formatTime(currentTime) }} / {{ formatTime(totalTime) }}
          </div>
        </div>
        
        <div class="progress-estimate">
          <span class="estimate-label">Estimated time remaining:</span>
          <span v-if="isEstimating" class="estimate-time estimating">Estimating...</span>
          <span v-else class="estimate-time">{{ formatTime(estimatedTimeRemaining) }}</span>
        </div>
      </div>
      
      <div class="modal-actions">
        <button class="btn btn-danger" @click="handleCancel">
          Cancel Encoding
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
  max-width: 500px;
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
  color: #2c3e50;
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

.progress-section {
  margin-bottom: 24px;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #ecf0f1;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2980b9);
  transition: width 0.3s ease;
  border-radius: 10px;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-percentage {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2c3e50;
}

.progress-time {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-family: 'Courier New', monospace;
}

.progress-estimate {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.estimate-label {
  font-size: 0.85rem;
  color: #7f8c8d;
  font-weight: 500;
}

.estimate-time {
  font-size: 0.9rem;
  color: #2c3e50;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.estimate-time.estimating {
  color: #f39c12;
  font-style: italic;
}

.modal-actions {
  display: flex;
  justify-content: center;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
}
</style> 