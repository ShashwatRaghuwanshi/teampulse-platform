<script>
  import { auth, API_BASE } from '$lib/state/auth.svelte.js';

  let title = $state('');
  let activityType = $state('FITNESS');
  let startDate = $state('2026-11-20');
  let endDate = $state('2026-12-20');
  let msg = $state('');

  let badgeRules = $state([
    { badge: 'Newcomer', threshold: '0 Days Streak', points: '0 pts' },
    { badge: 'Consistency Starter', threshold: '3 Consecutive Days', points: '150+ pts' },
    { badge: 'Streak Champion', threshold: '5 Consecutive Days', points: '250+ pts' }
  ]);

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

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem;">
  <div class="card">
    <h2>Create Team Wellness Challenge</h2>
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

  <div class="card">
    <h2>Automated Badge Rules (AWS Lambda Engine)</h2>
    <p style="font-size: 0.85rem; color: var(--tp-text-secondary); margin: 0.4rem 0 1rem;">
      Evaluated asynchronously via AWS EventBridge whenever an employee completes a wellness activity.
    </p>
    <div style="display: grid; gap: 0.75rem;">
      {#each badgeRules as rule}
        <div style="padding: 0.75rem; border: 1px solid var(--tp-border-subtle); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>{rule.badge}</strong>
            <div style="font-size: 0.8rem; color: var(--tp-text-secondary);">{rule.threshold}</div>
          </div>
          <span class="badge">{rule.points}</span>
        </div>
      {/each}
    </div>
  </div>
</div>