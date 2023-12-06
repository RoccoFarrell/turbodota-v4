<script lang="ts">
	import type { Session } from 'lucia';
	export let session: Session;

	import steam_logo from '$lib/assets/steam_logo.png';

	//console.log(session);
</script>

<nav class="list-nav p-4">
	<ul>
		<li>
			<a href="/">
				<span class="badge bg-primary-500"></span>
				<span class="flex-auto">Home</span></a
			>
		</li>
		<li><a href="/turbotown">Turbo Town</a></li>
		<li><a href="/herostats">Hero Stats</a></li>
		<li class="h-32 lg:h-4"></li>
		<hr class="!border-t-4" />
		{#if !session || !session.user}
			<li>
				<a class="" href="/api/auth/steam"
					>
                    <span><img class="w-6 ml-1.5" alt="steamlogo" src={steam_logo} /></span>
                    <span>Login</span>
				</a>
			</li>
		{:else}
        <form method="POST">
            <li><button class="btn w-full" formaction="/logout" type="submit">Logout</button></li>
        </form>
			
		{/if}
	</ul>
</nav>
