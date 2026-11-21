<script>
  import { auth, API_BASE } from '$lib/state/auth.svelte.js';

  let isRegisterMode = $state(false);
  let name = $state('');
  let email = $state('priya@teampulse.com');
  let password = $state('Password123!');
  let role = $state('EMPLOYEE');
  let teamId = $state('team-eng');
  let errorMsg = $state('');
  let insights = $state(null);
  let notifications = $state([]);

  async function handleSubmit(e) {
    e.preventDefault();
    errorMsg = '';
    const endpoint = isRegisterMode ? `${API_BASE}/auth/register` : `${API_BASE}/auth/login`;
    const payload = isRegisterMode ? { name, email, password, role, teamId } : { email, password };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      errorMsg = data.error || 'Authentication failed';
      return;
    }
    auth.setSession(data.user, data.token);
    loadDashboard();
  }

  async function quickLogin(demoEmail) {
    isRegisterMode = false;
    email = demoEmail;
    password = 'Password123!';
    await handleSubmit(new Event('submit'));
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
  <div class="card" style="max-width: 480px; margin: 2rem auto;">
    <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
      <button type="button" class="btn {!isRegisterMode ? '' : 'btn-outline'}" onclick={() => { isRegisterMode = false; errorMsg = ''; }}>
        Sign In
      </button>
      <button type="button" class="btn {isRegisterMode ? '' : 'btn-outline'}" onclick={() => { isRegisterMode = true; name = ''; email = ''; errorMsg = ''; }}>
        Register New Account
      </button>
    </div>

    <h2>{isRegisterMode ? 'Create TeamPulse Account' : 'Sign in to TeamPulse'}</h2>
    <p style="color: var(--tp-text-secondary); font-size: 0.9rem; margin: 0.35rem 0 1.1rem;">
      Internal Corporate Wellness & Engagement Platform
    </p>

    {#if errorMsg}
      <p style="color: var(--tp-danger); margin-bottom: 0.75rem; font-weight: 600;">{errorMsg}</p>
    {/if}

    <form onsubmit={handleSubmit} style="display: grid; gap: 0.85rem;">
      {#if isRegisterMode}
        <label>
          <strong>Full Name</strong>
          <input type="text" placeholder="e.g., Ananya Verma" bind:value={name} required style="width: 100%; padding: 0.55rem; margin-top: 0.25rem;" />
        </label>
      {/if}
      <label>
        <strong>Email</strong>
        <input type="email" placeholder="name@teampulse.com" bind:value={email} required style="width: 100%; padding: 0.55rem; margin-top: 0.25rem;" />
      </label>
      <label>
        <strong>Password</strong>
        <input type="password" bind:value={password} required style="width: 100%; padding: 0.55rem; margin-top: 0.25rem;" />
      </label>
      {#if isRegisterMode}
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <label>
            <strong>Role</strong>
            <select bind:value={role} style="width: 100%; padding: 0.55rem; margin-top: 0.25rem;">
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
          <label>
            <strong>Team</strong>
            <select bind:value={teamId} style="width: 100%; padding: 0.55rem; margin-top: 0.25rem;">
              <option value="team-eng">Engineering-Alpha</option>
              <option value="team-sec">Cloud-SecOps</option>
              <option value="team-prod">Product-Design</option>
            </select>
          </label>
        </div>
      {/if}
      <button type="submit" class="btn">{isRegisterMode ? 'Register & Enter Platform' : 'Sign In'}</button>
    </form>

    {#if !isRegisterMode}
      <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--tp-surface-muted);">
        <p style="font-size: 0.8rem; color: var(--tp-text-secondary); margin-bottom: 0.5rem;">One-Click Demo Role Login:</p>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-outline" onclick={() => quickLogin('priya@teampulse.com')}>Employee (Priya)</button>
          <button type="button" class="btn btn-outline" onclick={() => quickLogin('rajesh@teampulse.com')}>Manager (Rajesh)</button>
          <button type="button" class="btn btn-outline" onclick={() => quickLogin('admin@teampulse.com')}>Admin (Vikram)</button>
        </div>
      </div>
    {/if}
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
        <tp-progress-card title="Challenge Points" value="{insights.totalPoints} pts" subtitle="Team: {auth.user.teamId}" accent="#f59e0b"></tp-progress-card>
        <tp-progress-card title="Latest Badge" value={insights.activeBadge} subtitle="Earned via EventBridge Lambda" accent="#10b981"></tp-progress-card>
      </div>

      <div class="card">
        <h3>Recent Notifications & Milestones</h3>
        {#if notifications.length === 0}
          <p style="color: var(--tp-text-secondary); margin-top: 0.5rem;">No notifications yet. Complete a wellness habit to unlock your first badge!</p>
        {:else}
          <ul style="margin-top: 0.75rem; padding-left: 1.2rem; display: grid; gap: 0.45rem;">
            {#each notifications as n}
              <li><span class="badge">{n.category}</span> {n.message}</li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </div>
{/if}