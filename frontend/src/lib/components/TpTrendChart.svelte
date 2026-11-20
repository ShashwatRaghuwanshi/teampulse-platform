<svelte:options customElement="tp-trend-chart" />

<script>
  let { points = [], heading = 'Team Consistency Trend (%)' } = $props();
</script>

<div class="chart-card">
  <h4>{heading}</h4>
  <div class="bars">
    {#each points as pt}
      <div class="bar-col">
        <span class="pct">{pt.completionRate}%</span>
        <div class="bar" style="height: {Math.max(12, pt.completionRate * 1.4)}px;"></div>
        <span class="lbl">{pt.label}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .chart-card { background: var(--tp-surface-card, #fff); border: 1px solid var(--tp-border-subtle, #cbd5e1); border-radius: var(--tp-radius-md, 10px); padding: 1.25rem; }
  h4 { margin-bottom: 1rem; color: var(--tp-text-primary, #0f172a); }
  .bars { display: flex; align-items: flex-end; gap: 1.25rem; height: 180px; padding-top: 1rem; border-bottom: 2px solid var(--tp-surface-muted, #e2e8f0); }
  .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.35rem; }
  .bar { width: 100%; max-width: 44px; background: var(--tp-brand-primary, #0f766e); border-radius: 6px 6px 0 0; transition: height 0.3s ease; }
  .pct { font-size: 0.75rem; font-weight: 700; }
  .lbl { font-size: 0.8rem; color: var(--tp-text-secondary, #475569); }
</style>
