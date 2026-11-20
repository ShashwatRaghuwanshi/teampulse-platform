<script>
  import { auth, API_BASE } from '$lib/state/auth.svelte.js';

  let recommendations = $state([]);
  let banner = $state('');

  async function loadRecommendations() {
    const res = await fetch(`${API_BASE}/recommendations`, { headers: auth.getHeaders() });
    recommendations = await res.json();
  }

  async function acceptRecommendation(id) {
    const res = await fetch(`${API_BASE}/recommendations/${id}/accept`, {
      method: 'POST',
      headers: auth.getHeaders()
    });
    const data = await res.json();
    banner = `${data.message} (New Scheduled Time: ${data.newScheduledTime})`;
    loadRecommendations();
  }

  $effect(() => {
    loadRecommendations();
  });
</script>

<div style="display: grid; gap: 1.5rem;">
  <div class="card">
    <h2>Personalized Activity Timing Recommendations</h2>
    <p style="color: var(--tp-text-secondary); font-size: 0.9rem;">
      Powered by the <strong>Recommendation Microservice</strong> analyzing your completed vs. missed timestamps.
    </p>
  </div>

  {#if banner}
    <div class="card" style="background: #ecfdf5; border-color: #10b981; color: #065f46; font-weight: 600;">
      {banner}
    </div>
  {/if}

  {#each recommendations as rec}
    <div class="card" style="border-left: 4px solid var(--tp-brand-accent);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <span class="badge">Confidence: {Math.round(rec.confidenceScore * 100)}%</span>
          <span class="badge" style="background: #e0e7ff; color: #3730a3;">Status: {rec.status}</span>
          <h3 style="margin-top: 0.5rem;">{rec.habitTitle}</h3>
          <p style="color: var(--tp-text-secondary); margin: 0.35rem 0;">{rec.reason}</p>
          <p style="font-size: 0.9rem;">
            Current Schedule: <strong>{rec.currentSlot}</strong> → Suggested Optimal Slot: <strong style="color: var(--tp-brand-primary);">{rec.recommendedSlot}</strong>
          </p>
        </div>

        {#if rec.status === 'PENDING'}
          <button class="btn btn-success" onclick={() => acceptRecommendation(rec.id)}>
            Accept Recommendation
          </button>
        {:else}
          <span class="badge" style="background: #d1fae5; color: #065f46;">Schedule Updated ✓</span>
        {/if}
      </div>
    </div>
  {/each}
</div>
