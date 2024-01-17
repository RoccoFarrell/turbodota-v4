<script lang="ts">
	import seasonLogo from '$lib/assets/seasonLogo.png';
	import TurbotownIntro from '$lib/components/TurbotownIntro.svelte';
	import SteamLogo from '$lib/assets/steam_logo.png';
</script>

<div class="w-full flex flex-col items-center justify-center space-y-4 pb-20">
	<TurbotownIntro />
	<div class="grid grid-cols-2 2xl:w-3/4 xl:w-4/5 md:w-7/8 w-9/10 justify-center items-center">
		<div class="w-fit mx-auto rounded-full border-4 border-b border-amber-500">
			<img src={seasonLogo} alt="town logo" class="w-96 rounded-full" />
		</div>
		<div class="w-3/4 mx-auto flex flex-col justify-center items-center space-y-4">
			<h1 class="h1 text-center text-tertiary-300 italic">Login to start your Turbotown!</h1>

			<button class="w-1/2 btn variant-ghost-success">
				<a class="" href="/api/auth/steam" data-sveltekit-preload-data="tap">
					<div class="flex items-center justify-around space-x-4">
						<span><img class="w-6 ml-1.5" alt="steamlogo" src={SteamLogo} /></span>
						<span>Login</span>
					</div>
				</a>
			</button>
		</div>
	</div>
</div>
