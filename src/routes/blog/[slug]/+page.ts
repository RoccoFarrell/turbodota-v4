import { error } from '@sveltejs/kit'

export async function load({ params }) {
	try {

		const response = await fetch('/api/posts')
		const posts: Post[] = await response.json()

		const post = await import(`../../../posts/${params.slug}.md`)

		return {
			content: post.default,
			meta: post.metadata,
			posts
		}
	} catch (e) {
		throw error(404, `Could not find ${params.slug}`)
	}
}
