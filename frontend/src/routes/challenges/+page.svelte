<script>
  import { auth, API_BASE } from '$lib/state/auth.svelte.js';

  let allChallenges = $state([]);
  let leaderboard = $state([]);
  let searchQuery = $state('');
  let activityType = $state('ALL');
  let statusFilter = $state('ALL');
  let startDate = $state('2026-01-01');
  let joinMsg = $state('');

  let filteredChallenges = $derived(
    allChallenges.filter((c) => {
      const matchQuery = c.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = activityType === 'ALL' || c.activityType === activityType;
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchDate = c.startDate >= startDate;
      return matchQuery && matchType && matchStatus && matchDate;
    })
  );

  async function loadChallenges() {
    const res = await fetch(`${API_BASE}/challenges`, { headers: auth.getHeaders() });
    const data = await res.json();
    allChallenges = data.challenges || [];
    leaderboard = data.leaderboard || [];
  }

  async function joinChallenge(id) {
    await fetch(`${API_BASE}/challenges/${id}/join`, { method: 'POST', headers: auth.getHeaders() });
    joinMsg = 'Successfully joined team challenge!';
    loadChallenges();
  }

  $effect(() => {
    loadChallenges();
  });
</script>

<div style="display: grid; gap: 1.5rem;">
  <div class="card">
    <h2>Team Wellness Challenges</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; margin-top: 1rem;">
      <input placeholder="Search challenges..." bind:value={searchQuery} style="padding: 0.5rem;" />
      <select bind:value={activityType} style="padding: 0.5rem;">
        <option value="ALL">All Activity Types</option>
        <option value="FITNESS">FITNESS</option>
        <option value="MOBILITY">MOBILITY</option>
        <option value="MINDFULNESS">MINDFULNESS</option>
      </select>
      <select bind:value={statusFilter} style="padding: 0.5rem;">
        <option value="ALL">All Statuses</option>
        <option value="ACTIVE">ACTIVE</option>
        <option value="COMPLETED">COMPLETED</option>
      </select>
      <input type="date" bind:value={startDate} style="padding: 0.5rem;" />
    </div>

    {#if joinMsg}
      <p style="color: var(--tp-success); font-weight: 600; margin-top: 0.75rem;">{joinMsg}</p>
    {/if}

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-top: 1.25rem;">
      {#each filteredChallenges as ch}
        <div class="card" style="background: #f8fafc;">
          <div style="display: flex; justify-content: space-between;">
            <span class="badge">{ch.activityType}</span>
            <span class="badge" style="background: #fef3c7; color: #92400e;">{ch.status}</span>
          </div>
          <h3 style="margin: 0.6rem 0 0.3rem;">{ch.title}</h3>
          <p style="font-size: 0.82rem; color: var(--tp-text-secondary);">
            {ch.startDate} to {ch.endDate} • {ch.participantsCount} Participants
          </p>
          {#if ch.joined}
            <button class="btn" style="margin-top: 0.85rem; background: #cbd5e1; color: #334155; cursor: default;" disabled>
              Joined ✓
            </button>
          {:else}
            <button class="btn" style="margin-top: 0.85rem;" onclick={() => joinChallenge(ch.id)}>
              Join Challenge
            </button>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <div>
    <h3 style="margin-bottom: 0.75rem;">Live Challenge Leaderboard</h3>
    <tp-leaderboard entries={leaderboard}></tp-leaderboard>
  </div>
</div>