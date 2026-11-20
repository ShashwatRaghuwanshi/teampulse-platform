<script>
  import { goto } from '$app/navigation';
  import '../lib/styles/tokens.css';
  import '../lib/components/TpProgressRing.svelte';
  import '../lib/components/TpProgressCard.svelte';
  import '../lib/components/TpLeaderboard.svelte';
  import '../lib/components/TpTrendChart.svelte';
  import { auth } from '$lib/state/auth.svelte.js';

  let { children } = $props();

  function handleLogout() {
    auth.logout();
    goto('/');
  }
</script>

<header class="topbar">
  <div class="brand">
    <strong>TeamPulse</strong>
    <span class="tag">Corporate Wellness</span>
  </div>

  {#if auth.user}
    <nav>
      <a href="/">Dashboard</a>
      {#if auth.user.role !== 'MANAGER'}
        <a href="/habits">My Habits</a>
        <a href="/challenges">Challenges</a>
        <a href="/recommendations">Recommendations</a>
      {/if}
      <a href="/analytics">Analytics</a>
      {#if auth.user.role === 'ADMIN'}
        <a href="/admin">Admin</a>
      {/if}
    </nav>

    <div class="user-box">
      <span>{auth.user.name} <strong>({auth.user.role})</strong></span>
      <button type="button" class="btn btn-outline" onclick={handleLogout}>Sign Out</button>
    </div>
  {/if}
</header>

<main class="container">
  {@render children()}
</main>

<style>
  .topbar { display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 2rem; background: #ffffff; border-bottom: 1px solid var(--tp-border-subtle); }
  .brand { display: flex; align-items: center; gap: 0.6rem; font-size: 1.2rem; }
  .tag { font-size: 0.72rem; background: #ccfbf1; color: #0f766e; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700; }
  nav { display: flex; gap: 1.25rem; }
  nav a { text-decoration: none; color: var(--tp-text-primary); font-weight: 600; font-size: 0.92rem; }
  nav a:hover { color: var(--tp-brand-primary); }
  .user-box { display: flex; align-items: center; gap: 0.85rem; font-size: 0.85rem; }
  .container { max-width: 1120px; margin: 1.75rem auto; padding: 0 1.25rem; }
</style>