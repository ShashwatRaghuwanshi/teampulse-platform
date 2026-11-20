<script>
  import { auth, API_BASE } from '$lib/state/auth.svelte.js';

  let habits = $state([]);
  let title = $state('');
  let activityType = $state('MOBILITY');
  let visibility = $state('PRIVATE');
  let scheduledTime = $state('09:00');
  let statusBanner = $state('');

  async function loadHabits() {
    const res = await fetch(`${API_BASE}/habits`, { headers: auth.getHeaders() });
    habits = await res.json();
  }

  async function createHabit(e) {
    e.preventDefault();
    await fetch(`${API_BASE}/habits`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify({ title, activityType, visibility, scheduledTime })
    });
    title = '';
    statusBanner = 'New wellness habit created in Amazon RDS!';
    loadHabits();
  }

  async function logActivity(habit, status) {
    await fetch(`${API_BASE}/events/activity`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify({
        habitId: habit.id,
        activityType: habit.activityType,
        status,
        loggedAt: new Date().toISOString()
      })
    });
    statusBanner = `Activity '${habit.title}' marked as ${status} → Event published to AWS EventBridge & processed by Lambda!`;
  }

  $effect(() => {
    loadHabits();
  });
</script>

<div style="display: grid; gap: 1.5rem;">
  <div class="card">
    <h2>Create Personal or Team Wellness Habit</h2>
    <form onsubmit={createHabit} style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.85rem; margin-top: 1rem;">
      <input placeholder="Habit title (e.g., 20-Min Walk)" bind:value={title} required style="padding: 0.5rem;" />
      <select bind:value={activityType} style="padding: 0.5rem;">
        <option value="MOBILITY">MOBILITY</option>
        <option value="FITNESS">FITNESS</option>
        <option value="HYDRATION">HYDRATION</option>
        <option value="MINDFULNESS">MINDFULNESS</option>
      </select>
      <select bind:value={visibility} style="padding: 0.5rem;">
        <option value="PRIVATE">PRIVATE (Only Me)</option>
        <option value="TEAM">TEAM (Shared Goal)</option>
      </select>
      <input type="time" bind:value={scheduledTime} style="padding: 0.5rem;" />
      <button type="submit" class="btn">+ Add Habit</button>
    </form>
  </div>

  {#if statusBanner}
    <div class="card" style="background: #ecfdf5; border-color: #10b981; color: #065f46; font-weight: 600;">
      {statusBanner}
    </div>
  {/if}

  <div class="card">
    <h2>My Active Habits & Daily Check-In</h2>
    <div style="display: grid; gap: 0.85rem; margin-top: 1rem;">
      {#each habits as h}
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.85rem; border: 1px solid var(--tp-border-subtle); border-radius: 8px; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <strong>{h.title}</strong>
            <div style="font-size: 0.82rem; color: var(--tp-text-secondary); margin-top: 0.2rem;">
              <span class="badge">{h.activityType}</span>
              <span class="badge" style="background: #e0e7ff; color: #3730a3;">{h.visibility}</span>
              <span style="margin-left: 0.5rem;">Scheduled Time: <strong>{h.scheduledTime}</strong></span>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-success" onclick={() => logActivity(h, 'COMPLETED')}>Mark Completed</button>
            <button class="btn btn-danger" onclick={() => logActivity(h, 'MISSED')}>Mark Missed</button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>