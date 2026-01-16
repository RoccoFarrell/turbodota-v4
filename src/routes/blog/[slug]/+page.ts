import { error } from '@sveltejs/kit'

export async function load({ params, fetch }) {
	try {
		console.log('params.slug in blog post slug: ', params.slug)
		const post = await import(`../../../posts/${params.slug}.md`)

		const response = await fetch('/api/posts')
		const posts: Post[] = await response.json()

		return {
			content: post.default,
			meta: post.metadata,
			posts
		}
	} catch (e) {
		error(404, `Could not find ${params.slug}, ${e}`)
	}
}
