<template>
  <div class="skeleton-card">
    <div class="sk-circle shimmer"></div>
    <div class="sk-lines">
      <div class="sk-line sk-line-1 shimmer"></div>
      <div class="sk-line sk-line-2 shimmer"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-lg);
  background: var(--mao-surface);
  border: 1px solid var(--mao-border-light);
}

.sk-circle {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.sk-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sk-line {
  height: 12px;
  border-radius: 4px;
}

.sk-line-1 { width: 60%; }
.sk-line-2 { width: 35%; }

.shimmer {
  background: linear-gradient(
    90deg,
    var(--mao-border-light) 25%,
    var(--mao-border) 50%,
    var(--mao-border-light) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
