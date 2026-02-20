<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const user = data.user;

	let scrollY = $state(0);
</script>

<svelte:window bind:scrollY />

<style>
	.page-wrapper {
		width: 100%;
		overflow-x: hidden;
	}

	.hero {
		position: relative;
		overflow: hidden;
		padding: 5rem 2rem 4rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		background: linear-gradient(180deg, rgba(10, 14, 39, 0.95) 0%, rgba(26, 15, 58, 0.85) 60%, transparent 100%);
	}

	/* Animated background orbs */
	.hero::before {
		content: '';
		position: absolute;
		top: -30%;
		left: 10%;
		width: 500px;
		height: 500px;
		background: radial-gradient(circle, rgba(0, 212, 255, 0.12) 0%, transparent 70%);
		border-radius: 50%;
		animation: float-slow 20s ease-in-out infinite;
		filter: blur(40px);
		z-index: 0;
	}

	.hero::after {
		content: '';
		position: absolute;
		bottom: -10%;
		right: 5%;
		width: 600px;
		height: 600px;
		background: radial-gradient(circle, rgba(255, 107, 53, 0.08) 0%, transparent 70%);
		border-radius: 50%;
		animation: float-slow-reverse 25s ease-in-out infinite;
		filter: blur(40px);
		z-index: 0;
	}

	@keyframes float-slow {
		0%, 100% {
			transform: translate(0, 0);
		}
		50% {
			transform: translate(30px, -50px);
		}
	}

	@keyframes float-slow-reverse {
		0%, 100% {
			transform: translate(0, 0);
		}
		50% {
			transform: translate(-40px, 40px);
		}
	}

	.hero-content {
		position: relative;
		z-index: 1;
		max-width: 1000px;
		animation: fade-in-up 1s ease-out;
	}

	@keyframes fade-in-up {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.hero-title {
		font-size: clamp(2.5rem, 8vw, 4.5rem);
		font-weight: 900;
		letter-spacing: -0.02em;
		margin: 0 0 1.5rem 0;
		background: linear-gradient(135deg, #00d4ff 0%, #00ffff 50%, #ff6b35 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-shadow: 0 0 40px rgba(0, 212, 255, 0.3);
		filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.2));
	}

	.hero-subtitle {
		font-size: 1.25rem;
		color: rgba(255, 255, 255, 0.7);
		margin: 0 0 2rem 0;
		font-weight: 300;
		line-height: 1.6;
	}

	.cta-button-group {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: 2rem;
	}

	.cta-button {
		padding: 1rem 2rem;
		font-size: 1rem;
		font-weight: 600;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.cta-button-primary {
		background: linear-gradient(135deg, #00d4ff 0%, #00ffff 100%);
		color: #0a0e27;
		box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
	}

	.cta-button-primary:hover {
		box-shadow: 0 0 40px rgba(0, 212, 255, 0.7), inset 0 0 20px rgba(255, 255, 255, 0.1);
		transform: translateY(-2px);
	}

	.cta-button-secondary {
		background: rgba(255, 107, 53, 0.2);
		color: #ff6b35;
		border: 2px solid #ff6b35;
	}

	.cta-button-secondary:hover {
		background: rgba(255, 107, 53, 0.3);
		box-shadow: 0 0 30px rgba(255, 107, 53, 0.3);
		transform: translateY(-2px);
	}

	.features-section {
		position: relative;
		padding: 3rem 2rem 4rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.section-title {
		font-size: 2.5rem;
		font-weight: 900;
		text-align: center;
		color: rgba(255, 255, 255, 0.95);
		margin-bottom: 3rem;
		letter-spacing: -0.01em;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1.5rem;
	}

	.feature-card {
		position: relative;
		padding: 2rem;
		border-radius: 0.75rem;
		background: rgba(26, 15, 58, 0.6);
		border: 1px solid rgba(0, 212, 255, 0.2);
		backdrop-filter: blur(10px);
		transition: all 0.4s cubic-bezier(0.23, 1, 0.320, 1);
		overflow: hidden;
		animation: slide-in 0.8s ease-out forwards;
		opacity: 0;
	}

	.feature-card:nth-child(1) {
		animation-delay: 0.1s;
	}
	.feature-card:nth-child(2) {
		animation-delay: 0.2s;
	}
	.feature-card:nth-child(3) {
		animation-delay: 0.3s;
	}
	.feature-card:nth-child(4) {
		animation-delay: 0.4s;
	}

	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.feature-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), transparent);
		transition: left 0.5s ease;
		pointer-events: none;
	}

	.feature-card:hover::before {
		left: 100%;
	}

	.feature-card:hover {
		border-color: rgba(0, 212, 255, 0.5);
		background: rgba(26, 15, 58, 0.8);
		box-shadow: 0 0 30px rgba(0, 212, 255, 0.2), inset 0 0 30px rgba(0, 212, 255, 0.05);
		transform: translateY(-4px);
	}

	.feature-icon {
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	.feature-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.95);
		margin-bottom: 0.75rem;
		letter-spacing: -0.01em;
	}

	.feature-description {
		font-size: 0.95rem;
		color: rgba(255, 255, 255, 0.6);
		line-height: 1.6;
	}

	/* Full-width centered CTA section */
	.auth-cta {
		position: relative;
		padding: 4rem 2rem 3rem;
		text-align: center;
		background: linear-gradient(180deg, transparent 0%, rgba(0, 212, 255, 0.04) 40%, rgba(0, 212, 255, 0.08) 100%);
		border-top: 1px solid rgba(0, 212, 255, 0.15);
	}

	.auth-cta-inner {
		max-width: 640px;
		margin: 0 auto;
	}

	.auth-cta-title {
		font-size: 2rem;
		font-weight: 800;
		margin-bottom: 1rem;
		background: linear-gradient(135deg, #00d4ff 0%, #ff6b35 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.auth-cta-description {
		font-size: 1.05rem;
		color: rgba(255, 255, 255, 0.6);
		margin-bottom: 2.5rem;
		line-height: 1.7;
	}

	.auth-cta-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

</style>

<div class="page-wrapper">
	<!-- Hero Section -->
	<div class="hero">
		<div class="hero-content">
			<h1 class="hero-title">Enter the Dark Rift</h1>
			<p class="hero-subtitle">
				Your Dota 2 matches are just the beginning. Build a meta-game empire, manage legendary heroes,
				and ascend through the ranks of an incremental dark fantasy world.
			</p>

			{#if user}
				<div class="cta-button-group">
					<a href="/incremental" class="cta-button cta-button-primary">
						Continue Your Journey
					</a>
				</div>
			{/if}
		</div>
	</div>

	<!-- Features Section -->
	<div class="features-section">
		<h2 class="section-title">Master the Realm</h2>

		<div class="features-grid">
			<div class="feature-card">
				<div class="feature-icon">🏋️</div>
				<h3 class="feature-title">Hero Training</h3>
				<p class="feature-description">
					Elevate your heroes through 7 specialized barracks. Train them to unlock devastating stats and
					prepare them for the trials ahead.
				</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">⛏️</div>
				<h3 class="feature-title">Scavenging & Bounties</h3>
				<p class="feature-description">
					Dispatch hero parties to harvest resources. Mine gold, gather wood, and build wealth through
					strategic party formations.
				</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">🌑</div>
				<h3 class="feature-title">Dark Rift Expeditions</h3>
				<p class="feature-description">
					Brave progressively difficult runs through the rift. Scale your power, unlock prestige, and
					reset to ascend even higher.
				</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">🗺️</div>
				<h3 class="feature-title">Atlas Exploration</h3>
				<p class="feature-description">
					Uncover hidden realms and mysterious locations. Each discovery grants unique rewards and
					expands your strategic options.
				</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">🔧</div>
				<h3 class="feature-title">Upgrade Tree</h3>
				<p class="feature-description">
					Invest in permanent upgrades that reshape your gameplay. Plan your progression path to
					maximize long-term power growth.
				</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">📜</div>
				<h3 class="feature-title">Quest Log</h3>
				<p class="feature-description">
					Complete objectives and claim rich rewards. Unlock milestones that unlock new capabilities
					and secrets of the realm.
				</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">🏦</div>
				<h3 class="feature-title">Bank & Inventory</h3>
				<p class="feature-description">
					Safeguard your wealth and manage rare items. Strategically deposit resources to protect
					against runs and maximize efficiency.
				</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">✨</div>
				<h3 class="feature-title">Hero Synergies</h3>
				<p class="feature-description">
					Combine heroes to unlock synergy bonuses. Strategic team composition amplifies your power
					exponentially.
				</p>
			</div>
		</div>
	</div>

	<!-- Centered Auth CTA -->
	<div class="auth-cta">
		<div class="auth-cta-inner">
			<h3 class="auth-cta-title">Link Your Dota 2 Account</h3>
			<p class="auth-cta-description">
				Connect via Steam or search by Account ID. Your match history becomes the foundation of your
				Dark Rift journey — every match you play strengthens your heroes and unlocks new possibilities.
			</p>

			{#if !user}
				<div class="auth-cta-buttons">
					<a href="/api/auth/google" class="cta-button cta-button-primary">
						Sign in with Google
					</a>
					<a href="/api/auth/steam" class="cta-button cta-button-secondary">
						Sign in with Steam
					</a>
				</div>
			{:else}
				<a href="/profile" class="cta-button cta-button-primary">
					Go to Profile
				</a>
			{/if}
		</div>
	</div>

</div>
