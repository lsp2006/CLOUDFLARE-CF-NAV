<template>
  <div class="skeleton-grid" :style="gridStyle">
    <SkeletonCard v-for="i in count" :key="i" />
  </div>
</template>

<script setup>
import SkeletonCard from './SkeletonCard.vue'

defineProps({
  /** @type {number} column count */
  count: { type: Number, default: 8 },
  /** @type {number} desktop columns */
  cols: { type: Number, default: 4 },
})

const gridStyle = {
  '--sk-cols': 4,
}
</script>

<style scoped>
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(var(--sk-cols, 4), 1fr);
  gap: var(--space-md);
}

@media (max-width: 1024px) {
  .skeleton-grid { --sk-cols: 3; }
}
@media (max-width: 768px) {
  .skeleton-grid { --sk-cols: 2; }
}
@media (max-width: 480px) {
  .skeleton-grid { --sk-cols: 1; }
}
</style>
