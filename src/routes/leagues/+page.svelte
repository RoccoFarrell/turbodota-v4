<script lang="ts">
    import { enhance } from '$app/forms';
	import Trophy_light from '$lib/assets/trophy_light.png';
</script>

<section class="w-3/4 mx-auto my-4 space-y-8">
	<div class="flex justify-center items-center space-x-8">
		<img src={Trophy_light} class="w-20 h-20" alt="leagues page" />
		<h2 class="h2">Leagues Admin</h2>
	</div>

    <div class="space-y-2">
        <h3 class="h3">Existing Leagues</h3>
        <div class="w-full border border-dashed border-red-500 p-4">League 1</div>
    </div>

    <div class="space-y-2">
        <h3 class="h3">Create a new League</h3>
        <form method="POST" class="space-y-2" use:enhance>
            <!-- <hgroup>
                <h2>Login</h2>
                <h3>Welcome back!</h3>
            </hgroup> -->
            <!-- <label for="username">Username</label>
            <input type="text" id="username" name="username" required /> -->
    
            <label for="leagueName" class="my-1">League Name</label>
            <input type="leagueName" id="leagueName" name="leagueName" placeholder="Turbotown Enjoyers" required class="input w-1/2 p-2"/>
    
            <label class="label">
                <span>Enter a comma separated list of your friend's Dota Account IDs:</span>
                <textarea class="textarea" id="dotaUsersList" name="dotaUsersList" rows="4" placeholder="100001, 20002, 30003, 40004, etc..." />
            </label>
    
            <button type="submit" class="btn variant-filled-secondary w-1/2">Create League</button>
        </form>
    </div>

	
</section>
