// test/sample.test.ts
import { describe, it, expect, test, vi, beforeAll } from 'vitest'; // 👈🏻 Added the `vi` import

//vi.mock('./prisma');

describe('players/accountID/matches', () => {
	let response: Response;
	let result: any;
	beforeAll(async () => {
		response = await fetch('http://localhost:5173/api/players/65110965/matches');
		result = await response.json();
	});
    
	it('endpoint should have response status 200', () => {
		expect(response.status).toBe(200);
	});

	it('should return -1 for d_diff if not supplied', () => {
		expect(result.d_diff).toEqual(-1)
	});

	it('should return a d_diff if d_diff is sent in query params', async () => {
        let testDdiff = 10
		let response_ddiff = await fetch(`http://localhost:5173/api/players/65110965/matches?d_diff=${testDdiff}`);
		let result_ddiff = await response_ddiff.json();
		expect(result_ddiff.d_diff).toEqual(testDdiff);
	});

	// it('should return -1 for d_diff if not supplied', () => {
	// 	expect(body.data).toBeDefined();
	// });
});
