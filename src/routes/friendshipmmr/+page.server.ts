import type { Actions, PageServerLoad } from './$types';

export const config = {
	isr: {
		expiration: 300,
		bypassToken: 'fbybpmuenv4foogdrax2ab2u863gxtqa4p15or78'
	}
};

export const load: PageServerLoad = async ({ params, locals, url, setHeaders, fetch }) => {
	//session info
	const user = locals.user;

	//get mmr data
	const getMMR = async () => {
		const response = await fetch(`/api/getMMR`, {
			method: 'Get',
			headers: {
				'content-type': 'application/json'
			}
		});

		let responseData = await response.json();

		return responseData;
	};

	setHeaders({
		'cache-control': 'max-age=3600'
	});

	return {
		streamed: {
			mmr: await getMMR(),
		}
	};
};
