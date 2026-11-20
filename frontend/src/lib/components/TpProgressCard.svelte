<svelte:options customElement="tp-progress-card" />

<script>
  let { title = '', value = '', subtitle = '', accent = '#0f766e' } = $props();
</script>

<div class="p-card" style="border-left: 4px solid {accent};">
  <div class="title">{title}</div>
  <div class="val">{value}</div>
  <div class="sub">{subtitle}</div>
</div>

<style>
  .p-card { background: var(--tp-surface-card, #ffffff); border: 1px solid var(--tp-border-subtle, #cbd5e1); border-radius: var(--tp-radius-md, 10px); padding: 1rem 1.25rem; box-shadow: var(--tp-shadow-sm); }
  .title { font-size: 0.8rem; font-weight: 600; color: var(--tp-text-secondary, #475569); text-transform: uppercase; }
  .val { font-size: 1.75rem; font-weight: 800; margin: 0.25rem 0; color: var(--tp-text-primary, #0f172a); }
  .sub { font-size: 0.82rem; color: var(--tp-text-secondary, #475569); }
</style>
