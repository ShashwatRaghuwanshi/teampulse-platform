<script>
  import { auth, API_BASE } from '$lib/state/auth.svelte.js';

  let personal = $state(null);
  let teamData = $state(null);

  async function loadAnalytics() {
    const teamId = auth.user?.teamId || 'team-eng';
    const teamRes = await fetch(`${API_BASE}/insights/team/${teamId}`, { headers: auth.getHeaders() });
    teamData = await teamRes.json();

    if (auth.user?.role !== 'MANAGER') {
      const perRes = await fetch(`${API_BASE}/insights/personal`, { headers: auth.getHeaders() });
      personal = await perRes.json();
    }
  }

  $effect(() => {
    loadAnalytics();
  });
</script>

<div style="display: grid; gap: 1.5rem;">
  <div class="card">
    <h2>Wellness Consistency & Engagement Analytics</h2>
    <p style="color: var(--tp-text-secondary); font-size: 0.9rem;">
      {teamData?.privacyNotice || 'Role-based privacy boundaries active'}
    </p>
  </div>

  {#if auth.user?.role !== 'MANAGER' && personal}
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
      <div class="card">
        <tp-progress-ring percentage={personal.completionRate} label="Personal Completion"></tp-progress-ring>
      </div>
      <tp-progress-card title="Completed Activities" value={personal.completedCount} subtitle="Logged in RDS"></tp-progress-card>
      <tp-progress-card title="Missed Slots" value={personal.missedCount} subtitle="Analyzed for timing insights" accent="#ef4444"></tp-progress-card>
    </div>
  {/if}

  {#if teamData}
    <tp-trend-chart
      heading="Aggregated Team Consistency Trend ({teamData.teamId}) — Anonymized DynamoDB Rollup"
      points={teamData.trends}
    ></tp-trend-chart>
  {/if}
</div>
