<svelte:options customElement="tp-leaderboard" />

<script>
  let { entries = [] } = $props();
</script>

<div class="lb-box">
  <table>
    <thead>
      <tr><th>Rank</th><th>Member</th><th>Team</th><th>Streak</th><th>Badge</th><th>Points</th></tr>
    </thead>
    <tbody>
      {#each entries as row, idx}
        <tr>
          <td><strong>#{idx + 1}</strong></td>
          <td>{row.memberName}</td>
          <td>{row.teamName}</td>
          <td>{row.streak} days</td>
          <td><span class="pill">{row.badge}</span></td>
          <td><strong>{row.points} pts</strong></td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .lb-box { overflow-x: auto; background: var(--tp-surface-card, #fff); border: 1px solid var(--tp-border-subtle, #cbd5e1); border-radius: var(--tp-radius-md, 10px); }
  table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
  th, td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--tp-surface-muted, #e2e8f0); }
  th { background: #f1f5f9; font-weight: 700; color: var(--tp-text-secondary, #475569); }
  .pill { background: #fef3c7; color: #92400e; padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
</style>
