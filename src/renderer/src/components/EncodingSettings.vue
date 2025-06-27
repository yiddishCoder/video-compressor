<script setup lang="ts">
import PresetSlider from './PresetSlider.vue'

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

interface Props {
  videoInfo: VideoInfo | null
  resolutions: ResolutionOption[]
  selectedResolution: ResolutionOption | null
  selectedPreset: number
  selectedCrf: number
  isEncoding: boolean
}

interface Emits {
  (e: 'update:selectedResolution', value: ResolutionOption | null): void
  (e: 'update:selectedPreset', value: number): void
  (e: 'update:selectedCrf', value: number): void
  (e: 'reset'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const presets = [
  { value: 0, label: 'veryslow', description: 'Takes the longest to process, produces the smallest file' },
  { value: 1, label: 'slower', description: 'Very slow to process, results in a smaller file' },
  { value: 2, label: 'slow', description: 'Slow to process, slightly smaller file' },
  { value: 3, label: 'medium', description: 'Balanced speed and file size (default)' },
  { value: 4, label: 'fast', description: 'Faster processing, slightly larger file' },
  { value: 5, label: 'faster', description: 'Much faster processing, larger file' },
  { value: 6, label: 'veryfast', description: 'Very quick to process, noticeably larger file' },
  { value: 7, label: 'superfast', description: 'Super quick to process, much larger file' },
  { value: 8, label: 'ultrafast', description: 'Fastest option, biggest file size' }
]

const crfOptions = [
  { value: 0, label: '18', description: 'Visually lossless, very large file' },
  { value: 1, label: '19', description: 'Excellent quality, large file' },
  { value: 2, label: '20', description: 'Very high quality, large file' },
  { value: 3, label: '21', description: 'High quality, good file size' },
  { value: 4, label: '22', description: 'Very good quality, good file size' },
  { value: 5, label: '23', description: 'Good quality, balanced file size' },
  { value: 6, label: '24', description: 'Good quality, balanced file size (default)' },
  { value: 7, label: '25', description: 'Decent quality, smaller file' },
  { value: 8, label: '26', description: 'Acceptable quality, smaller file' },
  { value: 9, label: '27', description: 'Lower quality, small file' },
  { value: 10, label: '28', description: 'Low quality, very small file' }
]

const crfValues = [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]

const getCrfIndex = (crfValue: number) => {
  return crfValues.indexOf(crfValue)
}

const getCrfValue = (index: number) => {
  return crfValues[index]
}

const handleReset = () => {
  emit('reset')
}
</script>

<template>
  <section class="section">
    <div class="section-header">
      <h2>Encoding Settings</h2>
      <button 
        class="btn btn-secondary btn-small" 
        @click="handleReset"
        :disabled="!videoInfo || isEncoding"
      >
        Reset to Default
      </button>
    </div>
    
    <!-- Resolution Selection -->
    <div class="setting-group">
      <label class="setting-label">Resolution</label>
      <select 
        :value="selectedResolution?.height || ''" 
        @change="(e) => {
          const target = e.target as HTMLSelectElement;
          const value = target.value;
          if (value) {
            const resolution = resolutions.find(r => r.height === parseInt(value));
            emit('update:selectedResolution', resolution || null);
          } else {
            emit('update:selectedResolution', null);
          }
        }"
        class="select"
        :disabled="!videoInfo || isEncoding"
      >
        <option v-if="!videoInfo" value="">Select a video file first</option>
        <option 
          v-for="resolution in resolutions" 
          :key="resolution.height"
          :value="resolution.height"
        >
          {{ resolution.label }} ({{ resolution.width }}×{{ resolution.height }})
        </option>
      </select>
    </div>

    <!-- Sliders Row -->
    <div class="slider-row">
      <!-- CRF Selection -->
      <div class="setting-group">
        <label class="setting-label">Quality (CRF)</label>
        <div class="setting-explanation">
          <p>CRF (Constant Rate Factor) controls video quality vs file size. Lower values = higher quality but larger files. Higher values = smaller files but lower quality.</p>
          <p><strong>Recommendation:</strong> Use 22-24 for most videos. Use 18-21 for important content, 25-28 where quality is not so important.</p>
        </div>
        <PresetSlider
          :model-value="getCrfIndex(selectedCrf)"
          :presets="crfOptions"
          :disabled="!videoInfo || isEncoding"
          @update:modelValue="val => emit('update:selectedCrf', getCrfValue(val))"
        />
      </div>

      <!-- Preset Selection -->
      <div class="setting-group">
        <label class="setting-label">Encoding Preset</label>
        <div class="setting-explanation">
          <p>Encoding preset controls processing speed vs compression efficiency. Slower presets = better compression but take longer to encode. Faster presets = quicker encoding but less efficient compression.</p>
          <p><strong>Recommendation:</strong> Use the slowest preset you have time for. "Medium" is a good balance for most users.</p>
        </div>
        <PresetSlider
          :model-value="selectedPreset"
          :presets="presets"
          :disabled="!videoInfo || isEncoding"
          @update:modelValue="val => emit('update:selectedPreset', val)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  margin-bottom: 12px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  width: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.setting-group {
  margin-bottom: 10px;
}

.slider-row {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.slider-row > .setting-group {
  flex: 1;
  min-width: 0;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

.slider-row > .setting-group > .setting-explanation {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.setting-label {
  display: block;
  margin-bottom: 4px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.setting-explanation {
  margin-bottom: 8px;
}

.setting-explanation p {
  margin: 0;
  font-size: 0.8rem;
  color: #7f8c8d;
  line-height: 1.4;
  font-style: italic;
}

.select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 0.9rem;
  background: white;
}

.preset-slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.preset-end-label {
  min-width: 60px;
  text-align: center;
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 600;
}

.preset-slider-container {
  position: relative;
  flex: 1;
  height: 48px;
  margin-bottom: 0;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: flex-start;
}

.preset-tick-bar {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  pointer-events: none;
  z-index: 3;
}

.preset-current-labels {
  margin-top: 8px;
  text-align: center;
}

.preset-current-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.preset-current-desc {
  color: #7f8c8d;
  font-size: 0.8rem;
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

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-small {
  padding: 4px 8px;
  font-size: 0.8rem;
}
</style> 