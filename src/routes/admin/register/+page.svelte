<div class="card container w-1/2 h-1/2 my-auto p-4">
<form method="POST">
	<hgroup>
		<h2 class="h2 text-center">Register</h2>
	</hgroup>

	<label for="name">Name</label>
	<input class="input" type="text" id="name" name="name" required />

	<label for="username">Username</label>
	<input class="input" type="text" id="username" name="username" required />

	<label for="password">Password</label>
	<input class="input" type="password" id="password" name="password" required />

	<button class="btn variant-filled w-1/2 my-4" type="submit">Register</button>
</form>
<p>Already have an account? <a href="/admin/login" class="text-blue-600 dark:text-blue-500 hover:underline">Login</a></p>
</div>