import type { RequestEvent } from '@sveltejs/kit';

/**
 * Creates a mock RequestEvent for testing API endpoints
 */
export const createMockRequestEvent = <T extends string>(
  request: Request,
  routeId: T
): RequestEvent<any, T> => ({
  request,
  params: {},
  route: { id: routeId },
  locals: {
    auth: {
      validate: vi.fn().mockResolvedValue({
        user: {
          id: 'test-user-id',
          accountId: 123
        }
      })
    }
  },
  cookies: new Map(),
  fetch: global.fetch,
  getClientAddress: () => '127.0.0.1',
  platform: {},
  url: new URL('http://localhost'),
  isDataRequest: false,
  isSubRequest: false
} as unknown as RequestEvent<any, T>);

/**
 * Creates a mock POST request for testing API endpoints
 */
export const createMockPostRequest = (body: Record<string, any>, url = 'http://localhost') => {
  return new Request(url, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}; 