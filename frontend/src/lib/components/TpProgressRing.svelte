<svelte:options customElement="tp-progress-ring" />

<script>
  let { percentage = 0, label = 'Completion' } = $props();
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let offset = $derived(circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference);
</script>

<div class="ring-wrap">
  <svg width="96" height="96" viewBox="0 0 96 96">
    <circle class="track" cx="48" cy="48" r={radius} />
    <circle class="fill" cx="48" cy="48" r={radius} stroke-dasharray={circumference} stroke-dashoffset={offset} />
  </svg>
  <div class="info">
    <strong>{percentage}%</strong>
    <span>{label}</span>
  </div>
</div>

<style>
  .ring-wrap { display: inline-flex; align-items: center; gap: 0.85rem; }
  circle { fill: none; stroke-width: 9; transform: rotate(-90deg); transform-origin: 50% 50%; }
  .track { stroke: var(--tp-surface-muted, #e2e8f0); }
  .fill { stroke: var(--tp-brand-primary, #0f766e); stroke-linecap: round; transition: stroke-dashoffset 0.35s ease; }
  .info strong { display: block; font-size: 1.35rem; color: var(--tp-text-primary, #0f172a); }
  .info span { font-size: 0.8rem; color: var(--tp-text-secondary, #475569); }
</style>
