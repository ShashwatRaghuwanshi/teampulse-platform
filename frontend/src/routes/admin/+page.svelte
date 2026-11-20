<script>
  import { auth, API_BASE } from '$lib/state/auth.svelte.js';

  let title = $state('');
  let activityType = $state('FITNESS');
  let startDate = $state('2026-11-20');
  let endDate = $state('2026-12-20');
  let msg = $state('');

  async function createChallenge(e) {
    e.preventDefault();
    await fetch(`${API_BASE}/challenges`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify({ title, activityType, startDate, endDate })
    });
    msg = `New team challenge '${title}' published!`;
    title = '';
  }
</script>

<div class="card" style="max-width: 560px;">
  <h2>Admin Governance: Create Team Challenge</h2>
  {#if msg}
    <p style="color: var(--tp-success); font-weight: 600; margin: 0.75rem 0;">{msg}</p>
  {/if}
  <form onsubmit={createChallenge} style="display: grid; gap: 0.85rem; margin-top: 1rem;">
    <input placeholder="Challenge Title" bind:value={title} required style="padding: 0.5rem;" />
    <select bind:value={activityType} style="padding: 0.5rem;">
      <option value="FITNESS">FITNESS</option>
      <option value="MOBILITY">MOBILITY</option>
      <option value="MINDFULNESS">MINDFULNESS</option>
    </select>
    <input type="date" bind:value={startDate} style="padding: 0.5rem;" />
    <input type="date" bind:value={endDate} style="padding: 0.5rem;" />
    <button type="submit" class="btn">Publish Challenge</button>
  </form>
</div>
