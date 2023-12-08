import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const getHeroes = async () => {
		const response = await fetch(`${url.origin}/api/getHeroes`, {
			method: 'Get',
			headers: {
				'content-type': 'application/json'
			}
		});

		let responseData = await response.json();

		console.log(Object.keys(responseData))
		responseData = {
			...responseData,
			allHeroes: responseData.allHeroes.sort((a: Hero,b: Hero) => {
				if(a.localized_name < b.localized_name) return -1
				else return 1
			})
		}

		return responseData;
	};


	const session = await locals.auth.validate()
	console.log(`session: ${session}`)
	return { session, heroDescriptions: await getHeroes() }
}
