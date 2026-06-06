<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div
        v-for="t in toast.queue.value"
        :key="t.id"
        class="toast-item"
        :class="'toast-' + t.type"
        @click="toast.remove(t.id)"
      >
        <span class="toast-icon">{{ icons[t.type] }}</span>
        <span class="toast-msg">{{ t.message }}</span>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import { toast } from '../../composables/useToast.js'

const icons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  max-width: 380px;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
  pointer-events: auto;
  backdrop-filter: blur(12px);
  box-shadow: var(--mao-shadow-lg);
  transition: all var(--transition-fast);
}

.toast-item:hover {
  transform: scale(1.02);
}

.toast-icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}

.toast-success {
  background: rgba(34, 197, 94, 0.92);
  color: #fff;
}
.toast-success .toast-icon { background: rgba(255,255,255,0.25); }

.toast-error {
  background: rgba(239, 68, 68, 0.92);
  color: #fff;
}
.toast-error .toast-icon { background: rgba(255,255,255,0.25); }

.toast-warning {
  background: rgba(245, 158, 11, 0.92);
  color: #fff;
}
.toast-warning .toast-icon { background: rgba(255,255,255,0.25); }

.toast-info {
  background: rgba(59, 130, 246, 0.92);
  color: #fff;
}
.toast-info .toast-icon { background: rgba(255,255,255,0.25); }

/* Transition */
.toast-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-leave-active {
  transition: all 0.25s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

@media (max-width: 480px) {
  .toast-container {
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>
