<script setup lang="ts">
import { computed } from 'vue'

interface Preset {
  value: number
  label: string
  description: string
}

const props = defineProps<{
  modelValue: number
  presets: Preset[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const min = 0
const max = computed(() => props.presets.length - 1)

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', parseInt(target.value))
}
</script>

<template>
  <div class="preset-slider-row">
    <span class="preset-end-label">{{ props.presets[0].label }}</span>
    <div class="preset-slider-container">
      <span v-for="(_, index) in props.presets" :key="index" class="preset-tick"></span>
      <input type="range" :value="props.modelValue" :min="min" :max="max" class="preset-slider"
        :class="{ 'disabled': props.disabled }" :disabled="props.disabled" @input="handleInput" />
    </div>

    <span class="preset-end-label">{{ props.presets[props.presets.length - 1].label }}</span>
  </div>
  <div class="preset-current-labels">
    <div class="preset-current-name">{{ props.presets[props.modelValue].label }}</div>
    <div class="preset-current-desc">{{ props.presets[props.modelValue].description }}</div>
  </div>
</template>

<style scoped>
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
  height: 36px;
  width: calc(100% - 16px);
  margin-bottom: 0;
  display: flex;
  justify-content: space-between;
  z-index: 3;
  margin-left: 8px;
  margin-right: 8px;
}

.preset-tick-bar {
  position: relative;
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

.preset-tick {
  width: 2px;
  height: 36px;
  background: #bdc3c7;/* linear-gradient(to bottom, #bdc3c7 0 40%, transparent 40% 60%, #bdc3c7 60% 100%); */
  border-radius: 1px;
  margin-left: -1px;
  margin-right: -1px;
}

.preset-slider {
  width: calc(100% + 16px);
  height: 4px;
  border-radius: 2px;
  background: #3498db;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  transition: all 0.3s ease;
  margin-top: 0;
  margin-bottom: 0;
  position: absolute;
  top: calc(50% - 2px);
  left: -8px;
  z-index: 2;
  /* transform: translateY(-50%); */
}

.preset-slider::-webkit-slider-thumb {
  z-index: 4;
  position: relative;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.preset-slider.disabled {
  background: #bdc3c7;
  opacity: 0.6;
}

.preset-slider.disabled::-webkit-slider-thumb {
  background: #95a5a6;
  cursor: not-allowed;
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
</style>