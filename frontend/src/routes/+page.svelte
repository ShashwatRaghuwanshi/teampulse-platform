<script>
  import { auth, API_BASE } from '$lib/state/auth.svelte.js';

  let email = $state('priya@teampulse.com');
  let password = $state('Password123!');
  let errorMsg = $state('');
  let insights = $state(null);
  let notifications = $state([]);

  async function handleLogin(e) {
    e.preventDefault();
    errorMsg = '';
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      errorMsg = data.error || 'Login failed';
      return;
    }
    auth.setSession(data.user, data.token);
    loadDashboard();
  }

  async function quickLogin(demoEmail) {
    email = demoEmail;
    password = 'Password123!';
    await handleLogin(new Event('submit'));
  }

  async function loadDashboard() {
    if (!auth.user || auth.user.role === 'MANAGER') return;
    const [insRes, notifRes] = await Promise.all([
      fetch(`${API_BASE}/insights/personal`, { headers: auth.getHeaders() }),
      fetch(`${API_BASE}/notifications`, { headers: auth.getHeaders() })
    ]);
    insights = await insRes.json();
    notifications = await notifRes.json();
  }

  $effect(() => {
    if (auth.user) loadDashboard();
  });
</script>

{#if !auth.user}
  <div class="card" style="max-width: 460px; margin: 2rem auto;">
    <h2>Sign in to TeamPulse</h2>
    <p style="color: var(--tp-text-secondary); font-size: 0.9rem; margin: 0.4rem 0 1.2rem;">
      Internal Corporate Wellness & Engagement Platform
    </p>

    {#if errorMsg}
      <p style="color: var(--tp-danger); margin-bottom: 0.75rem;">{errorMsg}</p>
    {/if}

    <form onsubmit={handleLogin} style="display: grid; gap: 0.85rem;">
      <label>
        <strong>Email</strong>
        <input type="email" bind:value={email} required style="width: 100%; padding: 0.55rem; margin-top: 0.25rem;" />
      </label>
      <label>
        <strong>Password</strong>
        <input type="password" bind:value={password} required style="width: 100%; padding: 0.55rem; margin-top: 0.25rem;" />
      </label>
      <button type="submit" class="btn">Sign In</button>
    </form>

    <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--tp-surface-muted);">
      <p style="font-size: 0.8rem; color: var(--tp-text-secondary); margin-bottom: 0.5rem;">One-Click Demo Role Login:</p>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-outline" onclick={() => quickLogin('priya@teampulse.com')}>Employee (Priya)</button>
        <button class="btn btn-outline" onclick={() => quickLogin('rajesh@teampulse.com')}>Manager (Rajesh)</button>
        <button class="btn btn-outline" onclick={() => quickLogin('admin@teampulse.com')}>Admin (Vikram)</button>
      </div>
    </div>
  </div>
{:else}
  <div style="display: grid; gap: 1.5rem;">
    <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2>Welcome back, {auth.user.name}</h2>
        <p style="color: var(--tp-text-secondary);">Team: <strong>{auth.user.teamId}</strong> | Role: <span class="badge">{auth.user.role}</span></p>
      </div>
      {#if auth.user.role === 'MANAGER'}
        <a href="/analytics" class="btn">View Aggregated Team Analytics →</a>
      {:else}
        <a href="/habits" class="btn">Log Today's Wellness Activity →</a>
      {/if}
    </div>

    {#if auth.user.role === 'MANAGER'}
      <div class="card">
        <h3>Privacy Boundary Active (Manager View)</h3>
        <p style="color: var(--tp-text-secondary); margin-top: 0.4rem;">
          To protect employee wellness privacy, individual habits and personal missed/completed logs are hidden.
          Visit the <strong>Analytics</strong> tab to inspect anonymized team-level participation trends.
        </p>
      </div>
    {:else if insights}
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
        <div class="card">
          <tp-progress-ring percentage={insights.completionRate} label="Habit Consistency"></tp-progress-ring>
        </div>
        <tp-progress-card title="Active Streak" value="{insights.currentStreak} Days" subtitle="Consecutive wellness days"></tp-progress-card>
        <tp-progress-card title="Challenge Points" value="{insights.totalPoints} pts" subtitle="Team: Engineering-Alpha" accent="#f59e0b"></tp-progress-card>
        <tp-progress-card title="Latest Badge" value={insights.activeBadge} subtitle="Earned via EventBridge Lambda" accent="#10b981"></tp-progress-card>
      </div>

      <div class="card">
        <h3>Recent Notifications & Milestones</h3>
        <ul style="margin-top: 0.75rem; padding-left: 1.2rem; display: grid; gap: 0.45rem;">
          {#each notifications as n}
            <li><span class="badge">{n.category}</span> {n.message}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
{/if}
