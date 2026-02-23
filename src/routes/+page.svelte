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

	.features-section {
		position: relative;
		padding: 1rem 2rem 4rem;
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

	/* ─── Golden Sign-In CTA ─── */

	.golden-cta-section {
		position: relative;
		display: flex;
		justify-content: center;
		padding: 2.5rem 2rem 3.5rem;
		overflow: hidden;
	}

	/* Faint gold divider lines above and below */
	.golden-cta-section::before,
	.golden-cta-section::after {
		content: '';
		position: absolute;
		left: 10%;
		right: 10%;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(255, 195, 0, 0.3), rgba(255, 215, 0, 0.45), rgba(255, 195, 0, 0.3), transparent);
	}
	.golden-cta-section::before { top: 0; }
	.golden-cta-section::after { bottom: 0; }

	.golden-cta-btn {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2.5rem;
		font-size: 1.05rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-decoration: none;
		color: #1a0f00;
		border: 1.5px solid rgba(255, 195, 0, 0.6);
		border-radius: 4px;
		cursor: pointer;
		background:
			linear-gradient(135deg, #ffd54f 0%, #ffb300 40%, #ff8f00 100%);
		box-shadow:
			0 0 18px rgba(255, 193, 7, 0.35),
			0 0 60px rgba(255, 152, 0, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		animation: gold-breathe 3s ease-in-out infinite;
		transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1);
		overflow: hidden;
		z-index: 1;
	}

	/* Shimmer sweep across the button */
	.golden-cta-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: -120%;
		width: 60%;
		height: 100%;
		background: linear-gradient(
			105deg,
			transparent 20%,
			rgba(255, 255, 255, 0.45) 50%,
			transparent 80%
		);
		animation: gold-shimmer 4s ease-in-out infinite;
		pointer-events: none;
		z-index: 2;
	}

	/* Decorative corner bracket — top-left */
	.golden-cta-btn::after {
		content: '';
		position: absolute;
		top: 4px;
		left: 4px;
		width: 10px;
		height: 10px;
		border-top: 2px solid rgba(255, 248, 225, 0.7);
		border-left: 2px solid rgba(255, 248, 225, 0.7);
		opacity: 0.55;
		transition: opacity 0.3s ease;
		pointer-events: none;
		z-index: 3;
	}

	.golden-cta-btn:hover::after {
		opacity: 1;
	}

	.golden-cta-btn:hover {
		transform: translateY(-3px) scale(1.02);
		box-shadow:
			0 0 30px rgba(255, 193, 7, 0.55),
			0 0 80px rgba(255, 152, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.35);
		border-color: rgba(255, 215, 0, 0.9);
		background:
			linear-gradient(135deg, #ffe082 0%, #ffc107 40%, #ffa000 100%);
		animation: gold-breathe-hover 3s ease-in-out infinite;
	}

	@keyframes gold-breathe-hover {
		0%, 100% {
			box-shadow:
				0 0 30px rgba(255, 193, 7, 0.55),
				0 0 80px rgba(255, 152, 0, 0.2),
				inset 0 1px 0 rgba(255, 255, 255, 0.35);
		}
		50% {
			box-shadow:
				0 0 40px rgba(255, 193, 7, 0.7),
				0 0 100px rgba(255, 152, 0, 0.3),
				inset 0 1px 0 rgba(255, 255, 255, 0.35);
		}
	}

	.golden-cta-btn:active {
		transform: translateY(0) scale(0.98);
		box-shadow:
			0 0 12px rgba(255, 193, 7, 0.4),
			inset 0 2px 4px rgba(0, 0, 0, 0.15);
	}

	@keyframes gold-breathe {
		0%, 100% {
			box-shadow:
				0 0 18px rgba(255, 193, 7, 0.35),
				0 0 60px rgba(255, 152, 0, 0.12),
				inset 0 1px 0 rgba(255, 255, 255, 0.3);
		}
		50% {
			box-shadow:
				0 0 28px rgba(255, 193, 7, 0.55),
				0 0 80px rgba(255, 152, 0, 0.2),
				inset 0 1px 0 rgba(255, 255, 255, 0.3);
		}
	}

	@keyframes gold-shimmer {
		0%, 100% { left: -120%; }
		50%      { left: 120%; }
	}

	.golden-cta-icon {
		display: flex;
		align-items: center;
		position: relative;
		z-index: 3;
		filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15));
	}

	.golden-cta-label {
		position: relative;
		z-index: 3;
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);
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
		gap: 1.25rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	/* ─── Rift Portal Auth Buttons (Homepage — larger) ─── */

	.rift-auth {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.5rem;
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		text-decoration: none;
		color: rgba(255, 255, 255, 0.9);
		border-radius: 4px;
		overflow: hidden;
		cursor: pointer;
		backdrop-filter: blur(10px);
		transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
	}

	/* Shimmer sweep */
	.rift-auth::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		transition: left 0.5s ease;
		pointer-events: none;
	}

	.rift-auth:hover::before {
		left: 100%;
	}

	/* Corner rune bracket — top-left */
	.rift-auth::after {
		content: '';
		position: absolute;
		top: 4px;
		left: 4px;
		width: 8px;
		height: 8px;
		opacity: 0.35;
		transition: opacity 0.3s ease;
		pointer-events: none;
	}

	.rift-auth:hover::after {
		opacity: 0.85;
	}

	.rift-auth__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		position: relative;
		z-index: 1;
	}

	.rift-auth__sep {
		width: 1px;
		align-self: stretch;
		min-height: 18px;
		opacity: 0.3;
		transition: opacity 0.3s ease;
		position: relative;
		z-index: 1;
	}

	.rift-auth:hover .rift-auth__sep {
		opacity: 0.65;
	}

	.rift-auth__sep--cyan {
		background: linear-gradient(180deg, transparent, rgba(0, 212, 255, 0.6), transparent);
	}

	.rift-auth__sep--orange {
		background: linear-gradient(180deg, transparent, rgba(255, 107, 53, 0.6), transparent);
	}

	/* ── Google ── */

	.rift-auth--google {
		background: linear-gradient(135deg, rgba(0, 212, 255, 0.06) 0%, rgba(26, 15, 58, 0.7) 40%, rgba(10, 14, 39, 0.85) 100%);
		border: 1px solid rgba(0, 212, 255, 0.25);
		box-shadow: 0 0 12px rgba(0, 212, 255, 0.08);
		animation: rift-breathe-cyan 6s ease-in-out infinite;
	}

	.rift-auth--google::before {
		background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.12), transparent);
	}

	.rift-auth--google::after {
		border-top: 1.5px solid rgba(0, 212, 255, 0.6);
		border-left: 1.5px solid rgba(0, 212, 255, 0.6);
	}

	.rift-auth--google:hover {
		border-color: rgba(0, 212, 255, 0.6);
		box-shadow: 0 0 30px rgba(0, 212, 255, 0.3), inset 0 0 20px rgba(0, 212, 255, 0.06);
		transform: translateY(-3px);
		background: linear-gradient(135deg, rgba(0, 212, 255, 0.12) 0%, rgba(26, 15, 58, 0.85) 40%, rgba(10, 14, 39, 0.95) 100%);
		animation: none;
	}

	/* ── Steam ── */

	.rift-auth--steam {
		background: linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(26, 15, 58, 0.7) 40%, rgba(10, 14, 39, 0.85) 100%);
		border: 1px solid rgba(255, 107, 53, 0.25);
		box-shadow: 0 0 12px rgba(255, 107, 53, 0.06);
		animation: rift-breathe-orange 7s ease-in-out infinite;
	}

	.rift-auth--steam::before {
		background: linear-gradient(90deg, transparent, rgba(255, 107, 53, 0.12), transparent);
	}

	.rift-auth--steam::after {
		border-top: 1.5px solid rgba(255, 107, 53, 0.6);
		border-left: 1.5px solid rgba(255, 107, 53, 0.6);
	}

	.rift-auth--steam:hover {
		border-color: rgba(255, 107, 53, 0.6);
		box-shadow: 0 0 30px rgba(255, 107, 53, 0.25), inset 0 0 20px rgba(255, 107, 53, 0.05);
		transform: translateY(-3px);
		background: linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(26, 15, 58, 0.85) 40%, rgba(10, 14, 39, 0.95) 100%);
		animation: none;
	}

	/* Breathing glow */

	@keyframes rift-breathe-cyan {
		0%, 100% { box-shadow: 0 0 12px rgba(0, 212, 255, 0.08); }
		50% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.18); }
	}

	@keyframes rift-breathe-orange {
		0%, 100% { box-shadow: 0 0 12px rgba(255, 107, 53, 0.06); }
		50% { box-shadow: 0 0 18px rgba(255, 107, 53, 0.15); }
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
					<a href="/darkrift" class="cta-button cta-button-primary">
						Continue Your Journey
					</a>
				</div>
			{/if}
		</div>
	</div>

	<!-- Golden Sign-In CTA (unauthenticated only) -->
	{#if !user}
		<div class="golden-cta-section">
			<a href="/api/auth/google" class="golden-cta-btn">
				<span class="golden-cta-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
						<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
					</svg>
				</span>
				<span class="golden-cta-label">Sign In Now</span>
			</a>
		</div>
	{/if}

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
					<a class="rift-auth rift-auth--google" href="/api/auth/google">
						<span class="rift-auth__icon">
							<svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
								<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
								<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
								<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
							</svg>
						</span>
						<span class="rift-auth__sep rift-auth__sep--cyan"></span>
						<span>Sign in with Google</span>
					</a>
					<a class="rift-auth rift-auth--steam" href="/api/auth/steam">
						<span class="rift-auth__icon">
							<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
								<path d="M11.979 0C5.678 0 .511 4.86.022 10.945l6.432 2.658a3.387 3.387 0 0 1 1.912-.588c.063 0 .125.002.188.006l2.861-4.142V8.83c0-2.63 2.143-4.77 4.778-4.77 2.637 0 4.78 2.14 4.78 4.77 0 2.634-2.143 4.776-4.78 4.776h-.112l-4.076 2.91c0 .05.004.1.004.15 0 1.975-1.607 3.582-3.582 3.582-1.756 0-3.218-1.272-3.52-2.946L.453 14.194C1.886 19.809 6.466 24 11.979 24c6.627 0 12-5.373 12-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.985 1.3 1.2a2.388 2.388 0 0 0 3.085-1.397 2.374 2.374 0 0 0-.005-1.824 2.387 2.387 0 0 0-1.277-1.29 2.373 2.373 0 0 0-1.736-.052l1.523.63c.925.383 1.363 1.448.98 2.373-.385.925-1.448 1.363-2.373.98h-.024zm11.1-9.39a3.184 3.184 0 0 0-3.18-3.184 3.187 3.187 0 0 0-3.186 3.183 3.187 3.187 0 0 0 3.186 3.184 3.184 3.184 0 0 0 3.18-3.184zm-5.572-.01a2.394 2.394 0 0 1 2.39-2.393 2.397 2.397 0 0 1 2.395 2.394 2.397 2.397 0 0 1-2.395 2.393 2.394 2.394 0 0 1-2.39-2.393z"/>
							</svg>
						</span>
						<span class="rift-auth__sep rift-auth__sep--orange"></span>
						<span>Sign in with Steam</span>
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
